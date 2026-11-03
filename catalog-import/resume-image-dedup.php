<?php
require '/var/www/html/config/config.inc.php';
require_once '/var/www/html/app/AppKernel.php';
require_once '/var/www/html/app/AdminKernel.php';
global $kernel;$kernel=new AdminKernel('dev',true);$kernel->boot();
$db=Db::getInstance();$dir='/tmp/image-dedup-backup-20261028-023150';$backup=json_decode(file_get_contents($dir.'/database-image-tables.json'),true);$plan=$backup['plan'];
foreach($plan as $p){$id=$p['remove'];$keep=$p['keep'];if(!$db->execute('INSERT IGNORE INTO '._DB_PREFIX_.'product_attribute_image (id_product_attribute,id_image) SELECT id_product_attribute,'.$keep.' FROM '._DB_PREFIX_.'product_attribute_image WHERE id_image='.$id))throw new Exception('Association transfer failed');$im=new Image($id);if(Validate::isLoadedObject($im)){if(!$im->delete())throw new Exception('Delete failed '.$id);}else{$im->id=$id;$im->id_product=$p['product'];$im->deleteImage();}}
$errors=[];
foreach(array_unique(array_column($plan,'product')) as $pid){$rs=$db->executeS('SELECT id_image FROM '._DB_PREFIX_.'image WHERE id_product='.$pid.' ORDER BY position,id_image');foreach($rs as $n=>$r)$db->execute('UPDATE '._DB_PREFIX_.'image SET position='.($n+1).' WHERE id_image='.(int)$r['id_image']);}
foreach($plan as $p){if($db->getValue('SELECT COUNT(*) FROM '._DB_PREFIX_.'image WHERE id_image='.$p['remove']))$errors[]=$p['remove'];if(!$db->getValue('SELECT COUNT(*) FROM '._DB_PREFIX_.'image WHERE id_image='.$p['keep']))$errors[]='missing kept '.$p['keep'];}
Tools::clearSmartyCache();$result=['deleted'=>count($plan),'products'=>count(array_unique(array_column($plan,'product'))),'errors'=>$errors,'images_before'=>count($backup['image']),'images_after'=>(int)$db->getValue('SELECT COUNT(*) FROM '._DB_PREFIX_.'image')];file_put_contents($dir.'/result.json',json_encode($result));echo json_encode($result);

