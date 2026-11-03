<?php
if(PHP_SAPI!=='cli')exit;
require '/var/www/html/config/config.inc.php';
$db=Db::getInstance();
$rows=$db->executeS('SELECT * FROM '._DB_PREFIX_.'image ORDER BY id_product,cover DESC,position,id_image');
$seen=[];$plan=[];$missing=[];
foreach($rows as $r){$im=new Image((int)$r['id_image']);$path=(_PS_IMG_DIR_.'p/').$im->getExistingImgPath().'.jpg';if(!is_file($path)){$missing[]=$r['id_image'];continue;}$hash=hash_file('sha256',$path);$key=$r['id_product'].':'.$hash;if(isset($seen[$key]))$plan[]=['remove'=>(int)$r['id_image'],'keep'=>$seen[$key],'product'=>(int)$r['id_product'],'hash'=>$hash];else $seen[$key]=(int)$r['id_image'];}
if(($argv[1]??'')!=='apply'){echo json_encode(['duplicates'=>count($plan),'products'=>count(array_unique(array_column($plan,'product'))),'missing'=>$missing,'jersey'=>array_values(array_filter($plan,fn($p)=>$p['product']===667))]);exit;}
$dir='/tmp/image-dedup-backup-'.date('Ymd-His');mkdir($dir,0700,true);$backup=['plan'=>$plan];foreach(['image','image_shop','image_lang','product_attribute_image'] as $table)$backup[$table]=$db->executeS('SELECT * FROM '._DB_PREFIX_.$table);file_put_contents($dir.'/database-image-tables.json',json_encode($backup));$files=0;
foreach($plan as $p){$im=new Image($p['remove']);$base=$im->getExistingImgPath();foreach(glob((_PS_IMG_DIR_.'p/').$base.'*') as $file){if(!is_file($file))continue;$rel=substr($file,strlen((_PS_IMG_DIR_.'p/')));$dest=$dir.'/img/p/'.$rel;if(!is_dir(dirname($dest)))mkdir(dirname($dest),0700,true);if(!copy($file,$dest)||hash_file('sha256',$file)!==hash_file('sha256',$dest))throw new Exception('Backup mismatch');$files++;}}
foreach($plan as $p){$id=$p['remove'];$keep=$p['keep'];if(!$db->execute('INSERT IGNORE INTO '._DB_PREFIX_.'product_attribute_image (id_product_attribute,id_image) SELECT id_product_attribute,'.$keep.' FROM '._DB_PREFIX_.'product_attribute_image WHERE id_image='.$id))throw new Exception('Association transfer failed');$im=new Image($id);if(!$im->delete())throw new Exception('Delete failed '.$id);}
Tools::clearSmartyCache();
$remaining=$db->executeS('SELECT id_image,id_product,cover,position FROM '._DB_PREFIX_.'image ORDER BY id_product,position');$seen=[];$dups=[];foreach($remaining as $r){$im=new Image((int)$r['id_image']);$path=(_PS_IMG_DIR_.'p/').$im->getExistingImgPath().'.jpg';if(!is_file($path))continue;$key=$r['id_product'].':'.hash_file('sha256',$path);if(isset($seen[$key]))$dups[]=$r['id_image'];$seen[$key]=true;}
$result=['deleted'=>count($plan),'products'=>count(array_unique(array_column($plan,'product'))),'backup'=>$dir,'backed_up_files'=>$files,'remaining_identical_duplicates'=>$dups,'images_before'=>count($rows),'images_after'=>count($remaining)];file_put_contents($dir.'/result.json',json_encode($result));echo json_encode($result);

