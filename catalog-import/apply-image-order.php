<?php
if(PHP_SAPI!=='cli')exit;
require '/var/www/html/config/config.inc.php';
$db=Db::getInstance();$plan=json_decode(file_get_contents(__DIR__.'/image-order-plan.json'),true);$backup=['image'=>$db->executeS('SELECT * FROM '._DB_PREFIX_.'image'),'image_shop'=>$db->executeS('SELECT * FROM '._DB_PREFIX_.'image_shop')];
$backupFile=__DIR__.'/image-order-backup-'.date('Ymd-His').'.json';if(!file_put_contents($backupFile,json_encode($backup)))throw new Exception('Backup failed');
$resolved=[];foreach($plan as $p){$rows=$db->executeS('SELECT id_image FROM '._DB_PREFIX_.'image WHERE id_product='.$p['product'].' ORDER BY id_image');if(count($rows)!==count($p['order']))throw new Exception('Image count changed: '.$p['product']);$resolved[]=[$p,array_column($rows,'id_image')];}
$db->execute('START TRANSACTION');try{foreach($resolved as [$p,$ids]){$pid=$p['product'];$db->execute('UPDATE '._DB_PREFIX_.'image SET cover=NULL WHERE id_product='.$pid);$db->execute('UPDATE '._DB_PREFIX_.'image_shop SET cover=NULL WHERE id_product='.$pid);foreach($p['order'] as $pos=>$index){$iid=(int)$ids[$index];if(!$db->execute('UPDATE '._DB_PREFIX_.'image SET position='.($pos+1).', cover='.($pos===0?'1':'NULL').' WHERE id_image='.$iid))throw new Exception('Update failed');if($pos===0)$db->execute('UPDATE '._DB_PREFIX_.'image_shop SET cover=1 WHERE id_image='.$iid);}}$db->execute('COMMIT');}catch(Throwable $e){$db->execute('ROLLBACK');throw $e;}
echo json_encode(['updated'=>count($resolved),'backup'=>$backupFile]).PHP_EOL;
