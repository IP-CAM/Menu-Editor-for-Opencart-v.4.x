<?php
/**
 * Controller Module D.Menu Editor Class
 * 
 * @version 1.0
 * 
 * @author D.art <d.art.reply@gmail.com>
 */

namespace Opencart\Catalog\Controller\Extension\DMenuEditor\Module;
class DMenuEditor extends \Opencart\System\Engine\Controller {
    private $version = '1.1.2';

    private $languages = array();

    private $catalog = array();
    private $catalog_ancestor = false;

    private $catalog_db = array();
    private $prepared = array();

    private $current_class = 'current';
    private $current_ancestor_class = 'current-ancestor';

    private $settings = array(
        'menu' => array(
            'main' => array(
                'icon' => array(
                    'dimensions' => array(
                        'width'  => 16,
                        'height' => 16
                    )
                )
            ),
            'top' => array(
                'icon' => array(
                    'dimensions' => array(
                        'width'  => 16,
                        'height' => 16
                    )
                )
            ),
            'footer' => array(
                'icon' => array(
                    'dimensions' => array(
                        'width'  => 16,
                        'height' => 16
                    )
                )
            ),
            'social' => array(
                'icon' => array(
                    'dimensions' => array(
                        'width'  => 16,
                        'height' => 16
                    )
                )
            )
        ),
        'language_id' => 0
    );

    public function index(array $data): string {
        $this->load->language('extension/dmenu_editor/module/dmenu_editor');

        $this->load->model('localisation/language');
        $this->load->model('catalog/product');
        $this->load->model('extension/dmenu_editor/module/dmenu_editor');

        // All active languages.
        $this->languages = $this->model_localisation_language->getLanguages();

        // Current language ID.
        $this->settings['language_id'] = $this->config->get('config_language_id');

        // Setting 'Status'.
        if ($this->config->get('module_dmenu_editor_status')) {
            $data['module_dmenu_editor_status'] = $this->config->get('module_dmenu_editor_status');
        } else {
            $data['module_dmenu_editor_status'] = 0;
        }

        // Module Settings.
        if ($this->config->get('module_dmenu_editor_settings')) {
            $module_settings = $this->config->get('module_dmenu_editor_settings');
        } else {
            $module_settings = array();
        }

        // Settings Current Menu.
        if (isset($module_settings['menu'][$data['menu_type']])) {
            $data['settings_menu'] = $module_settings['menu'][$data['menu_type']];
        } else {
            $data['settings_menu'] = array(
                'status' => 0,
                'close'  => 0,
                'icon'   => $this->settings['menu'][$data['menu_type']]['icon']
            );
        }

        // Module version.
        $data['version'] = $this->version;

        // Additional data.
        $data['additional'] = array();

        // Items Menu.
        if ($this->config->get('module_dmenu_editor_items_' . $data['menu_type'])) {
            $data['menu_items'] = $this->config->get('module_dmenu_editor_items_' . $data['menu_type']);
            $data['menu_items_status'] = $module_settings['menu'][$data['menu_type']]['status'];
        } else {
            $data['menu_items'] = array();
            $data['menu_items_status'] = 0;
        }

        // Prepared data.
        if ($this->config->get('module_dmenu_editor_prepared')) {
            $prepared = $this->config->get('module_dmenu_editor_prepared');

            if (isset($prepared['menu'][$data['menu_type']]['IDs'])) {
                foreach ($prepared['menu'][$data['menu_type']]['IDs'] as $layout => $IDs) {
                    switch ($layout) {
                        // Category.
                        case 'category':
                            $this->prepared['menu']['data'][$layout] = $this->model_extension_dmenu_editor_module_dmenu_editor->getCategoriesPrepared($IDs);
                            break;

                        // Product.
                        case 'product':
                            $this->prepared['menu']['data'][$layout] = $this->model_extension_dmenu_editor_module_dmenu_editor->getProductsPrepared($IDs);
                            break;

                        // CMS Blog Article.
                        case 'blog_article':
                            $this->prepared['menu']['data'][$layout] = $this->model_extension_dmenu_editor_module_dmenu_editor->getBlogArticlesPrepared($IDs);
                            break;

                        // Default.
                        default:
                            break;
                    }
                }
            }
        }

        // Translated Text.
        $data['translated_text'] = array(
            'text_back' => $this->language->get('text_back'),
            'text_all'  => $this->language->get('text_all')
        );

        $data['entry_menu_type'] = sprintf($this->language->get('entry_menu_type'), $this->language->get('entry_menu_' . $data['menu_type']));

        // Change Language, if not defined.
        foreach ($data['menu_items'] as $item) {
            if ($item['data']['layout'] == 'catalog') {
                if (!array_key_exists($this->settings['language_id'], $item['data']['category_menu_names'])) {
                    foreach ($this->languages as $language) {
                        if (array_key_exists($language['language_id'], $item['data']['category_menu_names'])) {
                            $this->settings['language_id'] = $language['language_id'];
                            break;
                        }
                    }
                }
            } else {
                if (!array_key_exists($this->settings['language_id'], $item['data']['names'])) {
                    foreach ($this->languages as $language) {
                        if (array_key_exists($language['language_id'], $item['data']['names'])) {
                            $this->settings['language_id'] = $language['language_id'];
                            break;
                        }
                    }
                }
            }

            break;
        }

        // Change Menu Items.
        $this->changeMenuItems($data['menu_items'], 'current', $this->current_class);

        // All categories.
        if (!empty($this->catalog)) {
            $data['catalog'] = $this->catalog;
        } else {
            $data['catalog'] = array();
        }

        // Catalog columns.
        $data['additional']['catalog_column'] = version_compare(VERSION, '4.1.0.0', '<') ? true : false;

        // Top Menu additional data.
        if ($data['menu_type'] == 'top') {
            // Alert location.
            $data['additional']['alert'] = version_compare(VERSION, '4.0.2.0', '>=') ? 'outer' : 'inner';

            // Switchers HTML.
            $data['additional']['currency'] = $this->load->controller('common/currency');
            $data['additional']['language'] = $this->load->controller('common/language');
        }

        return $this->load->view('extension/dmenu_editor/module/dmenu_editor/menu/' . $data['menu_type'], $data);
    }

    /**
     * Change Menu Items. Recursion.
     * 
     * @param array $items
     * @param string $search_key
     * @param string $search_value
     * @param int $depth
     * 
     * @return bool
     */
    private function changeMenuItems(array &$items, string $search_key, string $search_value, int $depth = 0): bool {
        $ancestor = false;

        // Change Menu array.
        foreach ($items as &$item) {
            // Change Menu Item.
            $this->changeMenuItem($item);

            // Check Menu Item.
            if ($item['data'][$search_key] == $search_value) {
                // Set ancestor.
                if ($depth > 0) $ancestor = true;

                // Recursion.
                if (!empty($item['rows'])) {
                    $this->changeMenuItems($item['rows'], $search_key, $search_value, ($depth + 1));
                }
            } else if ($item['data']['layout'] == 'catalog' && $this->catalog_ancestor) {
                // Set ancestor.
                $ancestor = true;

                // Set 'current' class.
                $item['data'][$search_key] = $this->current_ancestor_class;
            } else if (!empty($item['rows']) && $this->changeMenuItems($item['rows'], $search_key, $search_value, ($depth + 1))) {
                // Set ancestor.
                $ancestor = true;

                // Set 'current' class.
                $item['data'][$search_key] = $this->current_ancestor_class;
            }
        }

        // Return.
        if ($ancestor) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Change Menu Item.
     * 
     * @param array $item
     * 
     * @return void
     */
    private function changeMenuItem(array &$item): void {
        $x = version_compare(VERSION, '4.0.2.0', '>=') ? '.' : '|';
        $layout = $item['data']['layout'];

        if ($layout == 'catalog') {
            // Get parts.
            if (isset($this->request->get['path'])) {
                $parts = explode('_', (string)$this->request->get['path']);
            } else {
                $parts = array();
            }

            // Set 'current' class.
            $item['data']['current'] = '';

            // Get All Categories.
            $this->getCatalog($parts);

            // Title Menu Item.
            $item['data']['title'] = $item['data']['category_menu_names'][$this->settings['language_id']];
        } else {
            // Change Menu Item array.
            switch ($layout) {
                // Home.
                case 'home':
                    $this->changeMenuItemOCPage($item, 'common/home', $layout);
                    break;

                // Contact Us.
                case 'contact':
                    $this->changeMenuItemOCPage($item, 'information/contact');
                    break;

                // Sitemap.
                case 'sitemap':
                    $this->changeMenuItemOCPage($item, 'information/sitemap');
                    break;

                // Cart.
                case 'cart':
                    $this->changeMenuItemOCPage($item, 'checkout/cart');
                    break;

                // Checkout.
                case 'checkout':
                    $this->changeMenuItemOCPage($item, 'checkout/checkout');
                    break;

                // Compare.
                case 'compare':
                    $this->changeMenuItemOCPage($item, 'product/compare');
                    break;

                // Wishlist.
                case 'wishlist':
                    $this->changeMenuItemOCPage($item, 'account/wishlist');
                    break;

                // Manufacturers.
                case 'manufacturers':
                    $this->changeMenuItemOCPage($item, 'product/manufacturer');
                    break;

                // Special.
                case 'special':
                    $this->changeMenuItemOCPage($item, 'product/special');
                    break;

                // Search.
                case 'search':
                    $this->changeMenuItemOCPage($item, 'product/search');
                    break;

                // Account.
                case 'account':
                    $this->changeMenuItemOCPage($item, 'account/account');
                    break;

                // Account Login.
                case 'login':
                    $this->changeMenuItemOCPage($item, 'account/login');
                    break;

                // Account Register.
                case 'register':
                    $this->changeMenuItemOCPage($item, 'account/register');
                    break;

                // Account Logout.
                case 'logout':
                    $this->changeMenuItemOCPage($item, 'account/logout');
                    break;

                // Information.
                case 'information':
                    // Get Current Information ID.
                    if (isset($this->request->get['information_id'])) {
                        $current_item_id = (int)$this->request->get['information_id'];
                    } else {
                        $current_item_id = 0;
                    }

                    // Set 'current' class.
                    if ($current_item_id == $item['data']['id']) {
                        $item['data']['current'] = $this->current_class;
                    } else {
                        $item['data']['current'] = '';
                    }

                    // Set href.
                    $item['data']['url']['href'] = $this->url->link('information/information', 'language=' . $this->config->get('config_language') . '&information_id=' . (int)$item['data']['id']);

                    break;

                // Category.
                case 'category':
                    // Get Current Category ID.
                    if (isset($this->request->get['path'])) {
                        $parts = explode('_', (string)$this->request->get['path']);
                        $current_item_id = (int)$this->endc($parts);
                    } else {
                        $current_item_id = 0;
                    }

                    // Set 'current' class.
                    if ($current_item_id == $item['data']['id'] && !isset($this->request->get['product_id'])) {
                        $item['data']['current'] = $this->current_class;
                    } else {
                        $item['data']['current'] = '';
                    }

                    // Get Category data.
                    if (!empty($this->prepared['menu']['data'][$layout]['category_' . $item['data']['id']])) {
                        $category_info = $this->prepared['menu']['data'][$layout]['category_' . $item['data']['id']];
                    } else {
                        $category_info = $this->model_extension_dmenu_editor_module_dmenu_editor->getCategory($item['data']['id']);
                    }

                    // Set href.
                    $item['data']['url']['href'] = $this->url->link('product/category', 'language=' . $this->config->get('config_language') . '&path=' . $category_info['path']);

                    break;

                // Product.
                case 'product':
                    // Get Current Product ID.
                    if (isset($this->request->get['product_id'])) {
                        $current_item_id = (int)$this->request->get['product_id'];
                    } else {
                        $current_item_id = 0;
                    }

                    // Set 'current' class.
                    if ($current_item_id == $item['data']['id']) {
                        $item['data']['current'] = $this->current_class;
                    } else {
                        $item['data']['current'] = '';
                    }

                    // Get Product data.
                    if (!empty($this->prepared['menu']['data'][$layout]['product_' . $item['data']['id']])) {
                        $product_info = $this->prepared['menu']['data'][$layout]['product_' . $item['data']['id']];
                    } else {
                        $product_info = $this->model_extension_dmenu_editor_module_dmenu_editor->getProduct($item['data']['id']);
                    }

                    // Set href.
                    if (empty($product_info['path'])) {
                        $item['data']['url']['href'] = $this->url->link('product/product', 'language=' . $this->config->get('config_language') . '&product_id=' . (int)$item['data']['id']);
                    } else {
                        $item['data']['url']['href'] = $this->url->link('product/product', 'language=' . $this->config->get('config_language') . '&path=' . $product_info['path'] . '&product_id=' . (int)$item['data']['id']);
                    }

                    break;

                // Manufacturer.
                case 'manufacturer':
                    // Get Current Manufacturer ID.
                    if (isset($this->request->get['manufacturer_id'])) {
                        $current_item_id = (int)$this->request->get['manufacturer_id'];
                    } else {
                        $current_item_id = 0;
                    }

                    // Set 'current' class.
                    if ($current_item_id == $item['data']['id']) {
                        $item['data']['current'] = $this->current_class;
                    } else {
                        $item['data']['current'] = '';
                    }

                    // Set href.
                    $item['data']['url']['href'] = $this->url->link('product/manufacturer' . $x . 'info', 'language=' . $this->config->get('config_language') . '&manufacturer_id=' . (int)$item['data']['id']);

                    break;

                // CMS Blog Category.
                case 'blog_category':
                    // Get Current Blog Category ID.
                    if (isset($this->request->get['topic_id'])) {
                        $current_item_id = (int)$this->request->get['topic_id'];
                    } else {
                        $current_item_id = 0;
                    }

                    // Set 'current' class.
                    if ($current_item_id == $item['data']['id']) {
                        $item['data']['current'] = $this->current_class;
                    } else {
                        $item['data']['current'] = '';
                    }

                    // Set href.
                    $item['data']['url']['href'] = $this->url->link('cms/blog', 'language=' . $this->config->get('config_language') . '&topic_id=' . $item['data']['id']);

                    break;

                // CMS Blog Article.
                case 'blog_article':
                    // Get Current Blog Article ID.
                    if (isset($this->request->get['article_id'])) {
                        $current_item_id = (int)$this->request->get['article_id'];
                    } else {
                        $current_item_id = 0;
                    }

                    // Set 'current' class.
                    if ($current_item_id == $item['data']['id']) {
                        $item['data']['current'] = $this->current_class;
                    } else {
                        $item['data']['current'] = '';
                    }

                    // Get Blog Article data.
                    if (!empty($this->prepared['menu']['data'][$layout]['blog_article_' . $item['data']['id']])) {
                        $blog_article_info = $this->prepared['menu']['data'][$layout]['blog_article_' . $item['data']['id']];
                    } else {
                        $blog_article_info = $this->model_extension_dmenu_editor_module_dmenu_editor->getBlogArticle($item['data']['id']);
                    }

                    // Set href.
                    if (empty($blog_article_info['topic_id'])) {
                        $item['data']['url']['href'] = $this->url->link('cms/blog' . $x . 'info', 'language=' . $this->config->get('config_language') . '&article_id=' . (int)$item['data']['id']);
                    } else {
                        $item['data']['url']['href'] = $this->url->link('cms/blog' . $x . 'info', 'language=' . $this->config->get('config_language') . '&topic_id=' . $blog_article_info['topic_id'] . '&article_id=' . (int)$item['data']['id']);
                    }

                    break;

                // Custom.
                case 'custom':
                    // Set prepared 'current' class.
                    $item['data']['current'] = '';

                    // Parse URL.
                    $parse_url = parse_url(str_replace('&amp;', '&', $item['data']['url']['seo'][$this->settings['language_id']]));

                    // Check 'query' from $parse_url.
                    if (isset($parse_url['query'])) {
                        if (isset($parse_url['path'])) {
                            // Home.
                            $array_home = array('/', 'index.php', 'index.html');
                            if ((!isset($this->request->get['route']) || $this->request->get['route'] == 'common/home') && in_array($parse_url['path'], $array_home)) {
                                // Set 'current' class.
                                $item['data']['current'] = $this->current_class;

                            // SEO URL.
                            } else if (isset($this->request->get['_route_']) && trim($this->request->get['_route_'], '/') == trim($parse_url['path'], '/')) {
                                // Set 'current' class.
                                $item['data']['current'] = $this->current_class;
                            }
                        } else {
                            parse_str($parse_url['query'], $query);

                            foreach ($query as $key => $value) {
                                if (isset($current) && !$current) break;

                                if (!empty($value) && array_key_exists($key, $this->request->get) && ($value == $this->request->get[$key])) {
                                    $current = true;
                                } else {
                                    $current = false;
                                }
                            }

                            // Set 'current' class.
                            if ($current) {
                                $item['data']['current'] = $this->current_class;
                            }
                        }

                    // Check 'path' from $parse_url.
                    } else if (isset($parse_url['path'])) {
                        // Home.
                        $array_home = array('/', 'index.php', 'index.html');
                        if ((!isset($this->request->get['route']) || $this->request->get['route'] == 'common/home') && in_array($parse_url['path'], $array_home)) {
                            // Set 'current' class.
                            $item['data']['current'] = $this->current_class;

                        // SEO URL.
                        } else if (isset($this->request->get['_route_']) && trim($this->request->get['_route_'], '/') == trim($parse_url['path'], '/')) {
                            // Set 'current' class.
                            $item['data']['current'] = $this->current_class;
                        }
                    }

                    // Set href.
                    $item['data']['url']['href'] = $item['data']['url']['seo'][$this->settings['language_id']];

                    break;

                // etc.
                default:
                    // Set 'current' class.
                    $item['data']['current'] = '';

                    // Set href.
                    $item['data']['url']['href'] = '';

                    break;
            }

            // Title Menu Item.
            $item['data']['title'] = $item['data']['names'][$this->settings['language_id']];
        }
    }

    /**
     * Get All Categories.
     * 
     * @param array $parts
     * 
     * @return void
     */
    private function getCatalog(array $parts): void {
        if (empty($this->catalog)) {
            $this->catalog_db = $this->model_extension_dmenu_editor_module_dmenu_editor->getCategoriesAll();

            $categories = array();

            foreach ($this->catalog_db as $category) {
                if ((int)$category['parent_id'] == 0) {
                    $categories[] = $category;
                }
            }

            $this->getCategories($categories, $this->catalog, $parts);
        }
    }

    /**
     * Get Categories hierarchy. Recursion.
     * 
     * @param array $categories
     * @param array $return
     * @param array $parts
     * @param int $index
     * @param string $path
     * 
     * @return void
     */
    private function getCategories(array $categories, array &$return, array $parts, int $index = 0, string $path = ''): void {
        $categories_count = count($categories);

        for ($i = 0; $i < $categories_count; $i++) {
            if ($index == 0 && version_compare(VERSION, '4.1.0.0', '>=')) $categories[$i]['top'] = 1; // OC v4.1.0.0+

            if (($index != 0) || ($index == 0 && $categories[$i]['top'])) {
                $filter_data = array(
                    'filter_category_id'  => $categories[$i]['category_id'],
                    'filter_sub_category' => true
                );

                // Concatenation 'path' param.
                $path_r = ($index == 0 ? $categories[$i]['category_id'] : $path . '_' . $categories[$i]['category_id']);

                $children = array();
                $children_data = array();

                // Get children.
                foreach ($this->catalog_db as $category) {
                    if ((int)$category['parent_id'] == (int)$categories[$i]['category_id']) {
                        $children[] = $category;
                    }
                }

                // Recursion.
                if (count($children) > 0) {
                    $this->getCategories($children, $children_data, $parts, ($index + 1), $path_r);
                }

                $current_class = '';
                $current_category_id = $this->endc($parts);

                // Set 'current' class.
                if ($current_category_id == $categories[$i]['category_id'] && !isset($this->request->get['product_id'])) {
                    $current_class = $this->current_class;
                    $this->catalog_ancestor = true;
                } else if (in_array($categories[$i]['category_id'], $parts) && !isset($this->request->get['product_id'])) {
                    $current_class = $this->current_ancestor_class;
                }

                // Set href.
                $href = $this->url->link('product/category', 'language=' . $this->config->get('config_language') . '&path=' . $path_r);

                // Category data.
                $return[] = array(
                    'name'     => $categories[$i]['name'] . ($this->config->get('config_product_count') && $index != 0 ? ' (' . $this->model_catalog_product->getTotalProducts($filter_data) . ')' : ''),
                    'children' => $children_data,
                    'column'   => isset($categories[$i]['column']) && $categories[$i]['column'] ? $categories[$i]['column'] : 1,
                    'href'     => $href,
					'current'  => $current_class
                );
            }
        }
    }

    /**
     * Change Menu Item OpenCart page.
     * 
     * @param array $item
     * @param string $route
     * @param string $layout
     * 
     * @return void
     */
    private function changeMenuItemOCPage(array &$item, string $route, string $layout = ''): void {
        // Set 'current' class.
        if ((!isset($this->request->get['route']) && ($layout == 'home')) || (isset($this->request->get['route']) && $this->request->get['route'] == $route)) {
            $item['data']['current'] = $this->current_class;
        } else {
            $item['data']['current'] = '';
        }

        // Set href.
        $item['data']['url']['href'] = $this->url->link($route, 'language=' . $this->config->get('config_language'));
    }

    /**
     * Return the last item of the array without affecting the internal array pointer.
     * 
     * @param array $array
     * 
     * @return string
     */
    private function endc(array $array): string {
        return end($array);
    }
}