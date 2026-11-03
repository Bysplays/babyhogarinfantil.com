<?php
if(PHP_SAPI!=='cli')exit;
require '/var/www/html/config/config.inc.php';
Shop::setContext(Shop::CONTEXT_SHOP,1);$db=Db::getInstance();
$backup=[];foreach(['layered_filter','layered_filter_shop','layered_category'] as $t)$backup[$t]=$db->executeS('SELECT * FROM '._DB_PREFIX_.$t);
$file='/tmp/bhi-filters-before-'.date('Ymd-His').'.json';if(file_put_contents($file,json_encode($backup,JSON_PRETTY_PRINT))===false)throw new Exception('Backup failed');
$row=$db->getRow('SELECT * FROM '._DB_PREFIX_.'layered_filter WHERE id_layered_filter=1');$data=Tools::unSerialize($row['filters']);
$categories=array_map('intval',array_column($db->executeS('SELECT c.id_category FROM '._DB_PREFIX_.'category c JOIN '._DB_PREFIX_.'category_shop cs ON cs.id_category=c.id_category AND cs.id_shop=1 WHERE c.active=1 AND c.id_category>1'),'id_category'));
$data['categories']=array_values(array_unique(array_merge($data['categories'],$categories)));
foreach($db->executeS('SELECT id_attribute_group FROM '._DB_PREFIX_.'attribute_group') as $group){$key='layered_selection_ag_'.(int)$group['id_attribute_group'];if(!isset($data[$key]))$data[$key]=['filter_type'=>0,'filter_show_limit'=>0];}
if(!$db->update('layered_filter',['filters'=>pSQL(serialize($data),true),'n_categories'=>count($data['categories'])],'id_layered_filter=1'))throw new Exception('Update failed');
$module=Module::getInstanceByName('ps_facetedsearch');$module->buildLayeredCategories();Tools::clearSmartyCache();
echo json_encode(['backup'=>$file,'categories'=>count($data['categories'])]).PHP_EOL;
