<?php
// Local CLI import only; uses PrestaShop models, never the source shop database.
if (PHP_SAPI !== 'cli') { exit; }
require '/var/www/html/config/config.inc.php';
set_time_limit(0);
$ctx=Context::getContext(); $ctx->shop=new Shop(1); Shop::setContext(Shop::CONTEXT_SHOP,1);
$ctx->language=new Language((int)Configuration::get('PS_LANG_DEFAULT'));
$ctx->currency=new Currency((int)Configuration::get('PS_CURRENCY_DEFAULT'));
$ctx->country=new Country((int)Configuration::get('PS_COUNTRY_DEFAULT'));
$ctx->employee=new Employee(1);
$root=__DIR__; $stateFile="$root/database-map.json";
$map=is_file($stateFile)?json_decode(file_get_contents($stateFile),true):[];
function saveMap(){global $map,$stateFile;file_put_contents($stateFile,json_encode($map,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));}
function ml($text){$r=[];foreach(Language::getLanguages(false) as $l)$r[$l['id_lang']]=$text;return $r;}
function cleanName($s){return trim(preg_replace('/[<>;=#{}]/u',' ', $s));}
function category($key,$name,$slug,$parent){global $map;if(isset($map['categories'][$key]))return $map['categories'][$key];$found=Db::getInstance()->getValue("SELECT c.id_category FROM "._DB_PREFIX_."category c JOIN "._DB_PREFIX_."category_lang l ON l.id_category=c.id_category WHERE c.id_parent=".(int)$parent." AND l.link_rewrite='".pSQL(ltrim($slug,"-"))."'");if($found){$map["categories"][$key]=(int)$found;saveMap();return (int)$found;}$c=new Category();$c->name=ml(cleanName($name));$c->link_rewrite=ml(ltrim($slug,'-')?:Tools::str2url($name));$c->id_parent=$parent;$c->active=1;if(!$c->add())throw new Exception('Category '.$name);$map['categories'][$key]=(int)$c->id;saveMap();return $c->id;}
$home=(int)Configuration::get('PS_HOME_CATEGORY');
$baby=category('baby','Bebé','bebe',$home);$kids=category('kids','Niños','ropa-infantil',$home);
$discovery=json_decode(file_get_contents("$root/migration/discovery.json"),true);
$parents=['820'=>[$baby,'Bebé niño'],'821'=>[$baby,'Bebé niña']];
// Navigation is ordered by parent, then its children; identify parent slugs explicitly.
$rootSlugs=['ropa-bebe-nino'=>[$baby,'Bebé niño'],'ropa-bebe-nina'=>[$baby,'Bebé niña'],'ropa-nino'=>[$kids,'Niño'],'ropa-nina'=>[$kids,'Niña'],'calzado'=>[$home,'Calzado'],'calcetines-y-leotardos'=>[$home,'Calcetines y leotardos'],'uniformes-escolares-en-vigo'=>[$home,'Uniformes escolares'],'ropa-de-bautizo'=>[$baby,'Bautizo'],'complementos'=>[$home,'Complementos']];
$sourceCategories=[];foreach($discovery['products'] as $entry)$sourceCategories[$entry['id']]=$entry['categoryIds'];
$current=$home;
foreach(array_merge($discovery['categories'],is_file("$root/migration/extra-categories.json")?json_decode(file_get_contents("$root/migration/extra-categories.json"),true):[]) as $c){if(!ctype_digit((string)$c['id']))continue;$slug=preg_replace('/^\d+-/','',basename(parse_url($c['url'],PHP_URL_PATH)));$label=$c['label'];$parent=isset($c['parentId'])?($map['categories'][$c['parentId']]??$home):$current;
 if(isset($rootSlugs[$slug])){[$parent,$label]=$rootSlugs[$slug];$current=category($c['id'],$label,$slug,$parent);}else{category($c['id'],$label,$slug,$parent);}}
function brandId($name){global $map;if(!$name)return 0;if(isset($map['brands'][$name]))return $map['brands'][$name];$b=new Manufacturer();$b->name=cleanName($name);$b->active=1;$b->add();$map['brands'][$name]=(int)$b->id;saveMap();return $b->id;}
function attrId($a){global $map;$g=(string)$a['groupId'];if(!isset($map['groups'][$g])){$o=new AttributeGroup();$o->name=ml(cleanName($a['group']));$o->public_name=$o->name;$o->group_type='select';$o->is_color_group=0;$o->add();$map['groups'][$g]=(int)$o->id;saveMap();}$key=$g.':'.$a['id'];if(!isset($map['attributes'][$key])){$o=new ProductAttribute();$o->id_attribute_group=$map['groups'][$g];$o->name=ml(cleanName($a['value']));$o->color='';$o->add();$map['attributes'][$key]=(int)$o->id;saveMap();}return $map['attributes'][$key];}
function taxGroup($rate){global $map;if(!$rate)return 0;$key=(string)$rate;if(isset($map['taxes'][$key]))return $map['taxes'][$key];$t=new Tax();$t->name=ml('IVA catálogo '.$key.'%');$t->rate=$rate;$t->active=1;$t->add();$g=new TaxRulesGroup();$g->name='Baby Hogar IVA '.$key.'%';$g->active=1;$g->add();$rule=new TaxRule();$rule->id_tax_rules_group=$g->id;$rule->id_country=(int)Configuration::get('PS_COUNTRY_DEFAULT');$rule->id_state=0;$rule->zipcode_from=0;$rule->zipcode_to=0;$rule->id_tax=$t->id;$rule->behavior=0;$rule->description='Importación pública';$rule->add();$map['taxes'][$key]=(int)$g->id;saveMap();return $g->id;}
function reduction($pid,$aid,$amount){if($amount<=0)return;$s=new SpecificPrice();$s->id_product=$pid;$s->id_product_attribute=$aid;$s->id_shop=1;$s->id_currency=0;$s->id_country=0;$s->id_group=0;$s->id_customer=0;$s->price=-1;$s->from_quantity=1;$s->reduction=$amount;$s->reduction_tax=1;$s->reduction_type='amount';$s->from='0000-00-00 00:00:00';$s->to='0000-00-00 00:00:00';$s->add();}
$limit=(int)($argv[1]??0);$processed=0;
foreach(glob("$root/migration/stage/products/*.json") as $file){$r=json_decode(file_get_contents($file),true);$sid=$r['id'];if(isset($map['done'][$sid]))continue;
try{
 $resume=isset($map['products'][$sid]); if(!$resume){
 $p=new Product();$p->name=ml(cleanName($r['name']));$p->link_rewrite=ml(Tools::str2url($r['name']));$p->description_short=ml(nl2br(htmlspecialchars($r['description'],ENT_QUOTES,'UTF-8')));$p->description=ml(nl2br(htmlspecialchars($r['details'],ENT_QUOTES,'UTF-8')));$p->reference=substr($r['sku']?:'BHI-'.$sid,0,64);$p->id_manufacturer=brandId($r['brand']);
 $cats=[$home];foreach(array_unique(array_merge($r['categoryIds'],$sourceCategories[$sid]??[])) as $cid)if(isset($map['categories'][$cid]))$cats[]=$map['categories'][$cid];$p->id_category_default=$map['categories'][$r['sourceDefaultCategoryId']]??end($cats);
 $rate=(float)($r['taxRate']??0);$factor=1+$rate/100;$base=$r['oldPrice']??$r['price'];$p->price=round($base/$factor,6);$p->id_tax_rules_group=taxGroup($rate);$p->active=0;$p->available_for_order=1;$p->show_price=1;$p->minimal_quantity=1;$p->visibility='both';$p->condition='new';$p->redirect_type='404';$p->indexed=0;
 if(!$p->add())throw new Exception('Product add failed');$map['products'][$sid]=(int)$p->id;saveMap();$expanded=$cats;foreach($cats as $cid){$ancestor=new Category($cid);while($ancestor->id_parent>1){$expanded[]=(int)$ancestor->id_parent;$ancestor=new Category($ancestor->id_parent);}}$p->addToCategories(array_unique($expanded));
 $comboMap=[];$first=true;$unknown=[];
 foreach($r['variants'] as $v){$aid=0;if(count($v['attributes'])){$c=new Combination();$c->id_product=$p->id;$c->reference=substr($v['sku']?:$p->reference,0,64);$c->minimal_quantity=1;$c->price=round((($v['oldPrice']??$v['price'])-$base)/$factor,6);$c->default_on=$first?1:null;$c->add();$c->setAttributes(array_map('attrId',$v['attributes']));$aid=$c->id;$comboMap[$v['id']]=$aid;$first=false;}if($v['quantity']===null)$unknown[]=$v['id'];StockAvailable::setQuantity($p->id,$aid,max(0,(int)($v['quantity']??0)),1);reduction($p->id,$aid,max(0,($v['oldPrice']??$v['price'])-$v['price']));}
 StockAvailable::setProductOutOfStock($p->id,0,1); } else { $p=new Product($map['products'][$sid]);$comboMap=[];$unknown=[]; } Product::updateDefaultAttribute($p->id);
 foreach($r['features'] as $f){if(trim((string)($f['name']??''))===''||trim((string)($f['value']??''))==='')continue;$key=$f['name'];if(!isset($map['features'][$key])){$o=new Feature();$o->name=ml(cleanName($key));$o->add();$map['features'][$key]=(int)$o->id;saveMap();}$vk=$key.'|'.$f['value'];if(!isset($map['values'][$vk])){$o=new FeatureValue();$o->id_feature=$map['features'][$key];$o->value=ml($f['value']);$o->custom=0;$o->add();$map['values'][$vk]=(int)$o->id;saveMap();}Product::addFeatureProductImport($p->id,$map['features'][$key],$map['values'][$vk]);}
 $imageIds=[];$position=0;
 foreach($r['images'] as $im){$src="$root/migration/stage/".$im['path'];if(!is_file($src))throw new Exception('Missing image '.$im['path']);$i=new Image();$i->id_product=$p->id;$i->position=++$position;$i->cover=$position===1?1:null;$i->legend=ml(mb_substr($r['name'],0,128));$i->add();$dest=$i->getPathForCreation();if(!ImageManager::resize($src,$dest.'.jpg'))throw new Exception('Image resize failed');foreach(ImageType::getImagesTypes('products') as $type){if(!ImageManager::resize($src,$dest.'-'.$type['name'].'.jpg',(int)$type['width'],(int)$type['height']))throw new Exception('Thumbnail failed');}$imageIds[]=$i->id;foreach($im['variantIds'] as $vid)if(isset($comboMap[$vid])){(new Combination($comboMap[$vid]))->setImages([$i->id]);}}
 $p->active=1;$p->save();Product::updateDefaultAttribute($p->id);if($r['sourceAddedAt']){foreach(['product','product_shop'] as $table)Db::getInstance()->update($table,['date_add'=>pSQL($r['sourceAddedAt'])],'id_product='.(int)$p->id);}
 unset($map['errors'][$sid]);$map['done'][$sid]=['id'=>$p->id,'images'=>count($imageIds),'combinations'=>count($comboMap),'unknownStock'=>$unknown,'issues'=>$r['issues'],'source'=>$r['sourceUrl'],'observedAt'=>$r['observedAt']];saveMap();echo "$sid -> {$p->id} OK\n";
}catch(Throwable $e){$map['errors'][$sid]=$e->getMessage();saveMap();echo "$sid ERROR ".$e->getMessage()."\n";}
if($limit&&++$processed>=$limit)break;
}
echo 'Imported total: '.count($map['done']??[])."\n";






