<?php
if(PHP_SAPI!=='cli')exit;
require '/var/www/html/config/config.inc.php';
$root=__DIR__;$map=json_decode(file_get_contents("$root/database-map.json"),true);$discovery=json_decode(file_get_contents("$root/migration/discovery.json"),true);
$missing=array_filter($discovery['products'],fn($r)=>!isset($map['done'][$r['id']]));if($missing){echo 'Not finalized: '.count($missing).' products still missing'.PHP_EOL;exit(1);}
foreach($discovery['products'] as $entry){$id=$map['products'][$entry['id']];$r=json_decode(file_get_contents("$root/migration/stage/products/{$entry['id']}.json"),true);$p=new Product($id);$cats=[(int)Configuration::get('PS_HOME_CATEGORY')];foreach(array_unique(array_merge($r['categoryIds'],$entry['categoryIds'])) as $cid)if(isset($map['categories'][$cid]))$cats[]=$map['categories'][$cid];$expanded=$cats;foreach($cats as $cid){$c=new Category($cid);while($c->id_parent>1){$expanded[]=(int)$c->id_parent;$c=new Category($c->id_parent);}}$needed=array_diff(array_unique($expanded),Product::getProductCategories($id));if($needed)$p->addToCategories($needed);if(isset($map['categories'][$r['sourceDefaultCategoryId']]) && (int)$p->id_category_default !== (int)$map['categories'][$r['sourceDefaultCategoryId']]){$p->id_category_default=$map['categories'][$r['sourceDefaultCategoryId']];$p->save();}unset($map['errors'][$entry['id']]);if(!array_filter($r['variants'],fn($v)=>$v['price']>0)){$p->available_for_order=0;$p->save();}if($r['sourceAddedAt'])foreach(['product','product_shop'] as $t)Db::getInstance()->update($t,['date_add'=>pSQL($r['sourceAddedAt'])],'id_product='.(int)$id);}
// Preserve the official slug, including its leading hyphen when present.
foreach($discovery['categories'] as $r){if(!isset($map['categories'][$r['id']]))continue;$slug=preg_replace('/^\d+-/','',basename(parse_url($r['url'],PHP_URL_PATH)));$c=new Category($map['categories'][$r['id']]);foreach(Language::getLanguages(false) as $l)$c->link_rewrite[$l['id_lang']]=$slug;$c->save();}
// Stock theme sample products remain recoverable, but no longer appear among imported clothes.
$samples=[];for($id=1;$id<=19;$id++){if(in_array($id,$map['products'],true))continue;$p=new Product($id);if(Validate::isLoadedObject($p)){$samples[$id]=(int)$p->active;$p->active=0;$p->save();}}
file_put_contents("$root/sample-products-previous-state.json",json_encode($samples,JSON_PRETTY_PRINT));
$sampleTaxonomy=[];
foreach(range(3,9) as $id){if(in_array($id,$map['categories'],true))continue;$count=Db::getInstance()->getValue('SELECT COUNT(*) FROM '._DB_PREFIX_.'category_product cp JOIN '._DB_PREFIX_.'product_shop p ON p.id_product=cp.id_product WHERE p.active=1 AND cp.id_category='.(int)$id);if(!$count){$c=new Category($id);if(Validate::isLoadedObject($c)){$sampleTaxonomy['categories'][$id]=(int)$c->active;$c->active=0;$c->save();}}}
foreach([1,2] as $id){if(in_array($id,$map['brands'],true))continue;$count=Db::getInstance()->getValue('SELECT COUNT(*) FROM '._DB_PREFIX_.'product p JOIN '._DB_PREFIX_.'product_shop s ON s.id_product=p.id_product WHERE s.active=1 AND p.id_manufacturer='.(int)$id);if(!$count){$m=new Manufacturer($id);if(Validate::isLoadedObject($m)){$sampleTaxonomy['brands'][$id]=(int)$m->active;$m->active=0;$m->save();}}}
file_put_contents("$root/sample-taxonomy-previous-state.json",json_encode($sampleTaxonomy,JSON_PRETTY_PRINT));
file_put_contents("$root/database-map.json",json_encode($map,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));Search::indexation(true);Media::clearCache();Tools::clearSmartyCache();echo 'Catalog finalized; sample products deactivated (not deleted).'.PHP_EOL;



