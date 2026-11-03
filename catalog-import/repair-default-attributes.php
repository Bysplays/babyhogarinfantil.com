<?php
if(PHP_SAPI!=='cli')exit;
require '/var/www/html/config/config.inc.php';
Shop::setContext(Shop::CONTEXT_SHOP,1);
$db=Db::getInstance();
$rows=$db->executeS('SELECT p.id_product,p.cache_default_attribute,p.product_type,ps.cache_default_attribute AS shop_default,pa.id_product_attribute FROM '._DB_PREFIX_.'product p JOIN '._DB_PREFIX_.'product_shop ps ON ps.id_product=p.id_product AND ps.id_shop=1 JOIN '._DB_PREFIX_.'product_attribute pa ON pa.id_product=p.id_product AND pa.default_on=1 WHERE p.id_product>19 AND (p.cache_default_attribute=0 OR ps.cache_default_attribute=0)');
$file='/tmp/bhi-default-attributes-before-'.date('Ymd-His').'.json';
if(file_put_contents($file,json_encode($rows,JSON_PRETTY_PRINT))===false)throw new Exception('Backup failed');
foreach($rows as $row)Product::updateDefaultAttribute((int)$row['id_product']);
Media::clearCache();Tools::clearSmartyCache();
echo json_encode(['backup'=>$file,'repaired'=>count($rows)]).PHP_EOL;
