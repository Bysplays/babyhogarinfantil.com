<?php
if (!defined('_PS_VERSION_')) { exit; }
class BabyHogarStudioSummaryModuleFrontController extends ModuleFrontController
{
    public $ajax = true;
    public function initContent()
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: private, no-store');
        $count = 0;
        if ($this->context->customer->isLogged() && Module::isEnabled('blockwishlist')) {
            require_once _PS_MODULE_DIR_ . 'blockwishlist/classes/WishList.php';
            $products = WishList::getAllProductByCustomer((int) $this->context->customer->id, (int) $this->context->shop->id);
            $count = count(array_unique(array_column($products ?: [], 'id_product')));
        }
        $this->ajaxRender(json_encode(['favorites' => $count]));
        exit;
    }
}
