<?php
if (!defined('_PS_VERSION_')) { exit; }
use PrestaShop\PrestaShop\Adapter\Presenter\Cart\CartPresenter;
class BabyHogarStudioBagModuleFrontController extends ModuleFrontController
{
    public $ajax = true;
    public function initContent()
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: private, no-store');
        $cart = (new CartPresenter())->present($this->context->cart);
        $this->context->smarty->assign([
            'bag' => $cart,
            'bag_catalog' => $this->context->link->getCategoryLink((int) Configuration::get('PS_HOME_CATEGORY')),
            'bag_cart' => $this->context->link->getPageLink('cart', true, null, 'action=show'),
            'bag_checkout' => $this->context->link->getPageLink('order', true),
        ]);
        $html = $this->context->smarty->fetch('module:babyhogarstudio/views/templates/front/bag.tpl');
        $this->ajaxRender(json_encode(['html' => $html, 'count' => (int) $cart['products_count']]));
        exit;
    }
}
