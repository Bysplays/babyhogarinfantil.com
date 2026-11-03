<?php
if(PHP_SAPI!=='cli')exit;
require '/var/www/html/config/config.inc.php';set_time_limit(0);
$root=__DIR__;$map=json_decode(file_get_contents("$root/database-map.json"),true);$lang=(int)Configuration::get('PS_LANG_DEFAULT');$added=0;$errors=[];
foreach($map['done'] as $sid=>$done){try{$p=new Product($done['id']);$r=json_decode(file_get_contents("$root/migration/stage/products/$sid.json"),true);$existing=$p->getImages($lang);$count=count($existing);
if($count>count($r['images']))throw new Exception('Unexpected extra images; manual review required');
for($pos=$count;$pos<count($r['images']);$pos++){$im=$r['images'][$pos];$src="$root/migration/stage/".$im['path'];$i=new Image();$i->id_product=$p->id;$i->position=$pos+1;$i->cover=$pos===0?1:null;foreach(Language::getLanguages(false) as $l)$i->legend[$l['id_lang']]=mb_substr($r['name'],0,128);$i->add();$dest=$i->getPathForCreation();if(!ImageManager::resize($src,$dest.'.jpg'))throw new Exception('Image resize');foreach(ImageType::getImagesTypes('products') as $type)if(!ImageManager::resize($src,$dest.'-'.$type['name'].'.jpg',(int)$type['width'],(int)$type['height']))throw new Exception('Thumbnail');$added++;}
$map['done'][$sid]['images']=count($r['images']);$map['done'][$sid]['issues']=$r['issues'];
}catch(Throwable $e){$errors[]=['id'=>$sid,'error'=>$e->getMessage()];}}
file_put_contents("$root/database-map.json",json_encode($map,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));file_put_contents("$root/image-append-report.json",json_encode(['added'=>$added,'errors'=>$errors],JSON_PRETTY_PRINT));echo "Added images: $added; errors: ".count($errors).PHP_EOL;
