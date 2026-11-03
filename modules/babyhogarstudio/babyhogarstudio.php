<?php
/** Editorial data and menu integration for BabyHogarInfantil. No catalog mutation. */
if (!defined('_PS_VERSION_')) { exit; }
class BabyHogarStudio extends Module
{
    public function __construct()
    {
        $this->name = 'babyhogarstudio';
        $this->tab = 'front_office_features';
        $this->version = '1.0.0';
        $this->author = 'Baby Hogar Infantil';
        $this->bootstrap = true;
        parent::__construct();
        $this->displayName = 'BabyHogarInfantil · Diseño de tienda';
        $this->description = 'Menú y contenido editorial del tema BabyHogarInfantil, conectado al catálogo de PrestaShop.';
        $this->ps_versions_compliancy = ['min' => '9.0.0', 'max' => '9.99.99'];
    }
    public function install()
    {
        return parent::install() && $this->registerHook('displayHeader')
            && Configuration::updateValue('BHI_PHONE', '886 166 179')
            && Configuration::updateValue('BHI_SEASON', 'OTOÑO / INVIERNO — 26');
    }
    private function normalized($name)
    {
        return Tools::str2url(trim((string) $name));
    }
    public function hookDisplayHeader()
    {
        $language = (int) $this->context->language->id;
        $rows = Category::getCategories($language, true, false);
        $categories = [];
        foreach ($rows as $category) {
            $categories[$this->normalized($category['name'])] = $category;
            if (!empty($category['link_rewrite'])) { $categories[$category['link_rewrite']] = $category; }
        }
        $resolve = function ($label, $slug = '') use ($categories) {
            $key = $this->normalized($label);
            $aliases = ['complemento' => 'complementos', 'ninos' => 'ropa-infantil'];
            $category = $categories[$slug] ?? $categories[$key] ?? $categories[$aliases[$key] ?? ''] ?? null;
            if ($category) {
                $object = new Category((int) $category['id_category']);
                if ($object->checkAccess((int) $this->context->customer->id)) {
                    return $this->context->link->getCategoryLink((int) $category['id_category']);
                }
            }
            return $this->context->link->getPageLink('search', null, null, ['s' => $label]);
        };
        $map = function ($items) use (&$map, $resolve) {
            foreach ($items as &$item) {
                $item['url'] = isset($item['page']) ? $this->context->link->getPageLink($item['page']) : $resolve($item['match'] ?? $item['label'], $item['slug'] ?? '');
                if (!empty($item['children'])) { $item['children'] = $map($item['children']); }
            }
            return $items;
        };
        $navigation = json_decode(file_get_contents(__DIR__ . '/navigation.json'), true);
        $brands = Db::getInstance()->executeS('SELECT m.id_manufacturer, m.name, COUNT(DISTINCT p.id_product) AS product_count
            FROM ' . _DB_PREFIX_ . 'manufacturer m
            INNER JOIN ' . _DB_PREFIX_ . 'manufacturer_shop ms ON ms.id_manufacturer = m.id_manufacturer AND ms.id_shop = ' . (int) $this->context->shop->id . '
            INNER JOIN ' . _DB_PREFIX_ . 'product p ON p.id_manufacturer = m.id_manufacturer
            INNER JOIN ' . _DB_PREFIX_ . 'product_shop ps ON ps.id_product = p.id_product AND ps.id_shop = ' . (int) $this->context->shop->id . ' AND ps.active = 1
            WHERE m.active = 1
            GROUP BY m.id_manufacturer, m.name
            ORDER BY product_count DESC, m.name ASC LIMIT 5');
        foreach ($brands as &$brand) { $brand['url'] = $this->context->link->getManufacturerLink((int) $brand['id_manufacturer']); }
        $variables = [
            'bh_navigation' => $map($navigation),
            'bh_collection_urls' => ['Bebé' => $resolve('Bebé'), 'Niño' => $resolve('Niño'), 'Niña' => $resolve('Niña')],
            'bh_catalog_url' => $this->context->link->getCategoryLink((int) Configuration::get('PS_HOME_CATEGORY')),
            'bh_phone' => Configuration::get('BHI_PHONE'),
            'bh_season' => Configuration::get('BHI_SEASON'),
            'bh_brands' => $brands,
        ];
        if (Module::isEnabled('blockwishlist')) {
            $variables['bh_wishlist_url'] = $this->context->link->getModuleLink('blockwishlist', 'lists');
            $variables['bh_wishlist_count'] = 0;
            if ($this->context->customer->isLogged()) {
                require_once _PS_MODULE_DIR_ . 'blockwishlist/classes/WishList.php';
                $products = WishList::getAllProductByCustomer($this->context->customer->id, $this->context->shop->id);
                $variables['bh_wishlist_count'] = count(array_unique(array_column($products ?: [], 'id_product')));
            }
        }
        $this->context->smarty->assign($variables);
        Media::addJsDef(['babyHogarSummaryUrl' => $this->context->link->getModuleLink($this->name, 'summary'), 'babyHogarBagUrl' => $this->context->link->getModuleLink($this->name, 'bag')]);
        return '';
    }
    public function getContent()
    {
        $output = '';
        if (Tools::isSubmit('submitBabyHogarStudio')) {
            $phone = trim((string) Tools::getValue('BHI_PHONE'));
            $season = trim((string) Tools::getValue('BHI_SEASON'));
            if (!preg_match('/^[0-9 +()-]{3,30}$/', $phone) || !Validate::isGenericName($season) || Tools::strlen($season) > 80) {
                $output .= $this->displayError('Revisa el teléfono y el texto de temporada (máximo 80 caracteres).');
            } else {
                Configuration::updateValue('BHI_PHONE', $phone);
                Configuration::updateValue('BHI_SEASON', $season);
                $output .= $this->displayConfirmation('Cambios guardados.');
            }
        }
        $helper = new HelperForm();
        $helper->module = $this;
        $helper->name_controller = $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        $helper->currentIndex = AdminController::$currentIndex . '&configure=' . $this->name;
        $helper->submit_action = 'submitBabyHogarStudio';
        $helper->fields_value = ['BHI_PHONE' => Configuration::get('BHI_PHONE'), 'BHI_SEASON' => Configuration::get('BHI_SEASON')];
        return $output . $helper->generateForm([['form' => [
            'legend' => ['title' => $this->displayName],
            'description' => 'El menú enlaza las categorías coincidentes del catálogo. Mientras una categoría no exista, abre su búsqueda. No crea ni altera productos. Las tres imágenes y el logo están en assets/img/babyhogar del tema.',
            'input' => [
                ['type' => 'text', 'label' => 'Teléfono', 'name' => 'BHI_PHONE', 'required' => true],
                ['type' => 'text', 'label' => 'Temporada', 'name' => 'BHI_SEASON', 'required' => true],
            ],
            'submit' => ['title' => 'Guardar'],
        ]]]);
    }
}
