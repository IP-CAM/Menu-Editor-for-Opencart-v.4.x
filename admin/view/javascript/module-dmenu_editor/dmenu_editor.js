/**
 * Script Module D.Menu Editor
 *
 * @version 1.0
 * 
 * @author D.art <d.art.reply@gmail.com>
 */

jQuery(function($) {
    // Set width of window to global variable.
    window.widthWindowDME = $(window).width();

    // Fire on document
    $(document).ready(function() {
        // Sortable Menu Items.
        sortableMenuItems();

        // Sortable Sticky Items.
        sortableStickyItems();

        // When Display device > 1200px.
        if (widthWindowDME <= 1200) {
            // Open/Hide Menu Items.
            $('.sticky-menu_items_button button').on('click', function(){
                $(this).closest('.module-menu_items_add').toggleClass('active');
            });
        }

        // Show/Hide Sticky Item.
        $('.sticky-menu_items_add .sticky-menu_item_title').on('click', function(){
            var _this = $(this);

            if (!_this.closest('.sticky-menu_item_wrap').hasClass('open')) {
                _this.closest('.sticky-menu_items_add').find('.sticky-menu_item_wrap').removeClass('open').find('.sticky-menu_item_content').hide(200, 'linear');
                _this.closest('.sticky-menu_item_wrap').toggleClass('open').find('.sticky-menu_item_content').first().toggle(200, 'linear');
            }
        });

        // Show/Hide Menu Item.
        $('.module-menu_items').on('click', '.fa_arrow_open', function(){
            $(this).closest('.module-menu_item_wrap').toggleClass('open').find('.module-dmenu_editor-item_content').first().toggle(200, 'linear');
        });

        // Change Title Menu Item (current language).
        $('.module-menu_items_wrap').on('change paste keyup', 'input.name_' + dmenu_configLanguageID, function() {
            var _this = $(this);
            var title = _this.val();

            if (title.length <= 0) {
                title = _this.closest('.module-menu_item_wrap').data('title');
            }

            _this.closest('.module-menu_item_wrap').find('.module-dmenu_editor-item_title').first().find('.text').text(title);
        });

        // Lock/Unlock URL field.
        $('.module-menu_items_wrap').on('click', '.item_url i', function() {
            var _this = $(this);
            var lock = _this.data('lock');
            var unlock = _this.data('unlock');

            // Change icon and tooltip.
            if (_this.hasClass('fa-lock')) {
                _this.removeClass('fa-lock').addClass('fa-unlock').attr('data-bs-original-title', lock);
                _this.prev().removeAttr('readonly');
            } else {
                _this.removeClass('fa-unlock').addClass('fa-lock').attr('data-bs-original-title', unlock);
                _this.prev().attr('readonly', '');
            }

            // Refresh tooltips.
            _this.closest('.module-menu_items_wrap').find('[data-bs-toggle="tooltip"]').tooltip();
        });

        // Show/Hide Title Catalog Settings.
        $('.module-menu_items_wrap').on('change', '.setting-category_menu select', function(){
            var _this = $(this);
            var categoryDisplay = _this.val();

            if (categoryDisplay == '1') {
                _this.closest('.module-dmenu_editor-item_content').find('.setting-category_menu_hidden_block').removeClass('hidden');
            } else {
                _this.closest('.module-dmenu_editor-item_content').find('.setting-category_menu_hidden_block').addClass('hidden');
            }
        });

        // Search Sticky Data. AJAX.
        $('.sticky_menu_item_search_button').on('click', function(){
            var _this = $(this);
            var layout = _this.data('layout');
            var search = _this.prev().val();

            var textButton = _this.text();
            var textLoading = _this.data('text_loading');

            $.ajax({
                url: 'index.php?route=extension/dmenu_editor/module/dmenu_editor' + dmenu_routeMethodSeparator + 'search&user_token=' + dmenu_userToken,
                type: 'post',
                data: 'layout=' + layout + '&limit=' + dmenu_searchLimit + '&search=' + search,
                dataType: 'json',
                beforeSend: function(){
                    _this.closest('.tab-pane').find('.sticky_menu_item_search_wrap').html(textLoading);

                    _this.closest('.sticky_menu_item_search_form').find('input').prop('disabled', true);
                    _this.closest('.sticky_menu_item_search_form').find('button').prop('disabled', true);

                    _this.closest('.sticky_menu_item_search_form').find('button').text(textLoading);
                },
                complete: function(){
                    _this.closest('.sticky_menu_item_search_form').find('input').prop('disabled', false);
                    _this.closest('.sticky_menu_item_search_form').find('button').prop('disabled', false);

                    _this.closest('.sticky_menu_item_search_form').find('button').text(textButton);
                },
                success: function(json) {
                    //console.log(json);

                    if (json && (typeof json === 'object') && (Object.keys(json).length !== 0) && (Object.getPrototypeOf(json) !== Object.prototype)) {
                        var searchResults = '';

                        for (var i = 0; i < json.length; i++) {
                            var searchDataNamesSeo = '';

                            for (language in dmenu_languages) {
                                searchDataNamesSeo += ' data-name_' + dmenu_languages[language]["language_id"] + '="' + ( ( typeof json[i]['names'] !== 'undefined' ) && ( typeof json[i]['names'][dmenu_languages[language]["language_id"]] !== 'undefined' ) ? json[i]['names'][dmenu_languages[language]["language_id"]] : '' ) + '" data-url_seo_' + dmenu_languages[language]["language_id"] + '="' + ( ( typeof json[i]['url']['seo'] !== 'undefined' ) && ( typeof json[i]['url']['seo'][dmenu_languages[language]["language_id"]] !== 'undefined' ) ? json[i]['url']['seo'][dmenu_languages[language]["language_id"]] : '' ) + '"';
                            }

                            searchResults += '<div class="sticky-menu_item-item sticky-menu_item-item_' + i + '">';
                                searchResults += '<span data-id="' + json[i]['id'] + '" data-url_link="' + json[i]['url']['link'] + '" data-layout="' + json[i]['layout'] + '" ' + searchDataNamesSeo + '>' + ( json[i]['title'] ? json[i]['title'] : dmenu_note_title_empty ) + '</span>';
                            searchResults += '</div>';
                        }

                        _this.closest('.tab-pane').find('.sticky_menu_item_search_wrap').html(searchResults);
                    } else {
                        _this.closest('.tab-pane').find('.sticky_menu_item_search_wrap').html(dmenu_text_search_missing);
                    }
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    alert(thrownError + "\r\n" + xhr.statusText + "\r\n" + xhr.responseText);
                }
            });
        });

        // Remove Menu Item.
        var timeoutRemoveID = null;
        $('.module-menu_items_wrap').on('click', '.fa_row_remove', function() {
            var textMissing = '';
            var speedAnimationHide = 200;
            var timeoutBeforeRepair = 500;
            var item = $(this).closest('.module-menu_item_wrap');
            var siblingsLength = item.siblings().length;
            var isSortableWrap = item.parent().is('.module-menu_items_wrap');
            var container = item.closest('.module-menu_items_wrap').prop('id');
            var removeOrNotRemove = null;

            // Remove or Not Remove, that is the question;
            // Whether 'tis nobler in the mind to suffer
            // The Slings and Arrows of outrageous Fortune
            // Or to take arms against a sea of troubles,
            // And by opposing, end them.
            if (item.find('.module-menu_item_wrap').length > 0) {
                removeOrNotRemove = confirm(dmenu_note_item_not_empty);
            }

            // The choice is made.
            // Remove.
            if (removeOrNotRemove || (removeOrNotRemove === null)) {
                // Removing.
                if (siblingsLength > 1) {
                    item.hide(speedAnimationHide, function(){ item.remove(); });
                } else if (siblingsLength == 1) {
                    if (item.siblings('.sortable_filtered').length > 0) {
                        item.hide(speedAnimationHide, function(){ item.remove(); });

                        //textMissing = displayMessageMissing();
                        //item.closest('.module-menu_items_wrap').append(textMissing);
                    } else {
                        item.hide(speedAnimationHide, function(){ item.remove(); });
                    }
                } else {
                    if (!$(this).hasClass('sortable_filtered')) {
                        item.hide(speedAnimationHide, function(){ item.remove(); });

                        if (isSortableWrap) {
                            textMissing = displayMessageMissing();
                            item.closest('.module-menu_items_wrap').append(textMissing);
                        }
                    }
                }

                // Repair Menu Items.
                if (timeoutRemoveID != null) {
                    window.clearTimeout(timeoutRemoveID);

                    timeoutRemoveID = window.setTimeout(function(){
                        repairMenuItems(container);
                    }, timeoutBeforeRepair);
                } else {
                    timeoutRemoveID = window.setTimeout(function(){
                        repairMenuItems(container);
                    }, timeoutBeforeRepair);
                }

            // or Not?..
            } else {}
        });
    });

    // Sortable Menu Items.
    function sortableMenuItems () {
        var menuSortable = [];
        var menuSortableWrap = [].slice.call(document.querySelectorAll('.nested-sortable'));

        for (var i = 0; i < menuSortableWrap.length; i++) {
            menuSortable[i] = new Sortable(menuSortableWrap[i], {
                group: {
                    name : 'shared',
                    pull : true,
                    put  : true
                },
                handle               : '.module-dmenu_editor-item_title',
                filter               : '.sortable_filtered',
                preventOnFilter      : false,
                animation            : 150,
                fallbackOnBody       : true,
                fallbackTolerance    : 0, //20
                swapThreshold        : 0.65,
                emptyInsertThreshold : 0, //5

                onEnd: function (event) {
                    //console.log(event);

                    var container = $(event.item).closest('.module-menu_items_wrap').prop('id');

                    // Repair Menu Items.
                    repairMenuItems(container);
                }
            });
        }
    }

    // Sortable Sticky Items.
    function sortableStickyItems () {
        var menuStickySortable = [];
        var menuStickySortableWrap = [].slice.call(document.querySelectorAll('.sticky-clone-sortable'));

        for (var i = 0; i < menuStickySortableWrap.length; i++) {
            menuStickySortable[i] = new Sortable(menuStickySortableWrap[i], {
                group: {
                    name : 'shared',
                    pull : 'clone',
                    put  : false
                },
                animation : 150,
                sort      : false,

                onStart: function (event) {
                    if (widthWindowDME <= 1200) {
                        $(event.item).closest('.module-menu_items_add').toggleClass('active');
                    }
                },

                onEnd: function (event) {
                    //console.log(event);

                    if (!$(event.to).hasClass('sticky-clone-sortable')) {
                        var _item = $(event.item);
                        var container = _item.closest('.module-menu_items_wrap').prop('id');
                        var menu = _item.closest('.module-menu_items').data('menu');

                        // Remove Missing message.
                        _item.closest('.module-menu_items_wrap').find('.not_repair').remove();

                        // Get data from attributes.
                        var id = _item.children().data('id');
                        var layout = _item.children().data('layout');
                        var urlLink = _item.children().data('url_link');
                        var title = _item.children().text();

                        var urlSeo = [];
                        var names = [];

                        for (language in dmenu_languages) {
                            if (typeof _item.children().data('url_seo_' + dmenu_languages[language]["language_id"]) !== 'undefined') {
                                urlSeo[dmenu_languages[language]["language_id"]] = _item.children().data('url_seo_' + dmenu_languages[language]["language_id"]);
                            } else {
                                urlSeo[dmenu_languages[language]["language_id"]] = '';
                            }

                            if (typeof _item.children().data('name_' + dmenu_languages[language]["language_id"]) !== 'undefined') {
                                names[dmenu_languages[language]["language_id"]] = _item.children().data('name_' + dmenu_languages[language]["language_id"]);
                            } else {
                                names[dmenu_languages[language]["language_id"]] = '';
                            }
                        }

                        // Row number.
                        var row = event.newIndex;

                        // Get current Layout and attribute 'readonly'.
                        var titleNotice = '';
                        var fieldReadonly = 'readonly';
                        var seoDisplay = false;

                        if (layout in dmenu_moduleLayouts) {
                            titleNotice = dmenu_moduleLayouts[layout];

                            switch (layout) {
                                case 'custom':
                                    fieldReadonly = '';
                                    seoDisplay = true;
                                    break;
                                default:
                                    break;
                            }
                        } else {
                            titleNotice = dmenu_text_item_desc_none;
                            fieldReadonly = '';
                        }

                        // Get depth of attributes: FOR, ID, NAME
                        var attrIdDepth = '';
                        var attrNameDepth = '';

                        if ($(event.to).is('.module-menu_items_wrap')) {
                            attrIdDepth = row;
                            attrNameDepth = '[' + row + ']';
                        } else {
                            var targetID = $(event.to).closest('.module-menu_item_wrap').prop('id');
                            var targetIdRows = targetID.match(/\w+$/);
                            var targetNameRows = targetIdRows[0].replaceAll('_', '][rows][');

                            attrIdDepth = targetIdRows[0] + '_' + row;
                            attrNameDepth = '[' + targetNameRows + '][rows][' + row + ']';
                        }

                        // Get Menu Item.
                        if (layout == 'catalog') {
                            var menuItemHTML = getCatalogMenuItem(layout, names, attrIdDepth, attrNameDepth, menu);

                            // Prepare Menu Item container.
                            _item.prop('id', menu + '-item-' + attrIdDepth).prop('class', 'form-group module-menu_item_wrap catalog_item').attr('data-row', row).data('row', row);
                        } else {
                            var menuItemHTML = getMenuItem(id, layout, title, titleNotice, urlLink, names, urlSeo, attrIdDepth, attrNameDepth, fieldReadonly, seoDisplay, menu);

                            // Prepare Menu Item container.
                            _item.prop('id', menu + '-item-' + attrIdDepth).prop('class', 'form-group module-menu_item_wrap').attr('data-title', title).data('title', title).attr('data-row', row).data('row', row);
                        }

                        // Set Menu Item.
                        _item.html(menuItemHTML);

                        // Repair Menu Items.
                        repairMenuItems(container);

                        // Refresh tooltips.
                        _item.closest('.module-menu_items_wrap').find('[data-bs-toggle="tooltip"]').tooltip();

                        // Refresh Sortable Menu Items.
                        sortableMenuItems();
                    }
                }
            });
        }
    }

    // Repair Menu Items.
    function repairMenuItems(container) {
        // Add visual loader.
        $('#' + container).closest('.module_menu').append('<div class="loader-repair"><div class="lds-dual-ring"></div></div>');

        // Repair attributes.
        repairAttributes(container);

        // Remove visual loader.
        $('#' + container).closest('.module_menu').find('.loader-repair').remove();
    }

    // Repair attributes. Recursion.
    function repairAttributes(container) {
        var _container = $('#' + container);
        var menu = _container.closest('.module-menu_items').data('menu');

        // Recursion condition.
        if (_container.children().length > 0) {
            _container.children().each(function(index, element) {
                var _this = $(this);

                if (!_this.is('.not_repair')) {
                    // Set data row to each element.
                    _this.attr('data-row', index).data('row', index);

                    // Get depth of attributes: FOR, ID, NAME.
                    var attrIdDepth = '';
                    var attrNameDepth = '';

                    if (_container.is('.module-menu_items_wrap')) {
                        attrIdDepth = index;
                        attrNameDepth = '[' + index + ']';
                    } else {
                        var targetID = _container.closest('.module-menu_item_wrap').prop('id');
                        var targetIdRows = targetID.match(/\w+$/);
                        var targetNameRows = targetIdRows[0].replaceAll('_', '][rows][');

                        attrIdDepth = targetIdRows[0] + '_' + index;
                        attrNameDepth = '[' + targetNameRows + '][rows][' + index + ']';
                    }

                    // Change attributes: FOR.
                    _this.find('label').each(function(iLabel, elLabel) {
                        var _elLabel = $(elLabel);

                        if (_elLabel.is('[for]')) {
                            let attrFor = _elLabel.prop('for');
                            let regExp = new RegExp(menu + '-item-\\w+-', 'g');
                            let newAttrFor = attrFor.replace(regExp, menu + '-item-' + attrIdDepth + '-');

                            _elLabel.attr('for', newAttrFor).prop('for', newAttrFor);
                        }
                    });

                    // Change attributes: ID, NAME.
                    _this.attr('id', menu + '-item-' + attrIdDepth).prop('id', menu + '-item-' + attrIdDepth);
                    _this.find('input, select, a').each(function(iField, elField) {
                        var _elField = $(elField);

                        if (_elField.is('[id]')) {
                            let attrID = _elField.prop('id');
                            let regExp = new RegExp(menu + '-item-\\w+-', 'g');
                            let newAttrID = attrID.replace(regExp, menu + '-item-' + attrIdDepth + '-');

                            _elField.attr('id', newAttrID).prop('id', newAttrID);
                        }

                        if (_elField.is('[name]')) {
                            let attrName = _elField.prop('name');
                            let regExp = new RegExp('module_dmenu_editor_items_' + menu + '[\\w\\[\\]]+?\\[data\\]', 'g');
                            let newAttrName = attrName.replace(regExp, 'module_dmenu_editor_items_' + menu + attrNameDepth + '[data]');

                            _elField.attr('name', newAttrName).prop('name', newAttrName);
                        }
                    });

                    // Change sortable container attributes: ID.
                    _this.find('.module-menu_items_wrap_content').each(function(iContainer, elContainer) {
                        var _elContainer = $(elContainer);

                        if (_elContainer.is('[id]')) {
                            let attrId = _elContainer.prop('id');
                            let regExp = new RegExp('module_menu_' + menu + '_nested_sortable-\\w+', 'g');
                            let newAttrId = attrId.replace(regExp, 'module_menu_' + menu + '_nested_sortable-' + attrIdDepth);

                            _elContainer.attr('id', newAttrId).prop('id', newAttrId);
                        }
                    });

                    // Recursion.
                    if (_this.find('.nested-sortable').first().children().length > 0) {
                        repairAttributes(_this.find('.nested-sortable').first().prop('id'));
                    }
                }
            });
        } else {
            return;
        }
    }

    // HTML Menu Item.
    function getMenuItem(id, layout, title, titleNotice, urlLink, names, urlSeo, attrIdDepth, attrNameDepth, fieldReadonly, seoDisplay, menu) {
        var menuItemHTML = '';

        menuItemHTML += '<div class="module-dmenu_editor-item">';
            menuItemHTML += '<label class="text-left module-dmenu_editor-item_title">';
                menuItemHTML += '<span class="text">' + title + '</span>';

                menuItemHTML += '<span class="buttons">';
                    menuItemHTML += '<span class="notice">' + titleNotice + '</span>';

                    if (urlLink && layout != 'custom') {
                        menuItemHTML += '<a href="/' + urlLink + '" class="a_item_href" target="_blank">';
                            menuItemHTML += '<i class="fas fa-eye fa_item_href" data-bs-toggle="tooltip" title="' + dmenu_button_look_tip + '"></i>';
                        menuItemHTML += '</a>';
                    } else {
                        menuItemHTML += '<a class="a_item_href"></a>';
                    }

                    menuItemHTML += '<i class="fas fa-trash-alt fa_row_remove" data-bs-toggle="tooltip" title="' + dmenu_button_remove_item_tip + '"></i>';
                    menuItemHTML += '<i class="fas fa-angle-down fa_arrow_open" data-bs-toggle="tooltip" title="' + dmenu_button_edit_item_tip + '"></i>';
                menuItemHTML += '</span>';
            menuItemHTML += '</label>';

            menuItemHTML += '<div class="module-dmenu_editor-item_content" style="display: none;">';
                menuItemHTML += '<div class="card-body">';
                    menuItemHTML += '<div class="field row required">';
                        menuItemHTML += '<label class="col-sm-2 control-label col-form-label" for="' + menu + '-item-' + attrIdDepth + '-data-names_' + dmenu_configLanguageID + '">' + dmenu_entry_name + '</label>';
                        menuItemHTML += '<div class="col-sm-10 module-dmenu_editor-item_title_languages">';

                            for (language in dmenu_languages) {
                                menuItemHTML += '<div class="input-group pull-left">';
                                    menuItemHTML += '<span class="input-group-text">';
                                        menuItemHTML += '<img src="language/' + dmenu_languages[language]["code"] + '/' + dmenu_languages[language]["code"] + '.png" title="' + dmenu_languages[language]["name"] + '" />';
                                    menuItemHTML += '</span>';

                                    menuItemHTML += '<input type="text" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][names][' + dmenu_languages[language]["language_id"] + ']" id="' + menu + '-item-' + attrIdDepth + '-data-names_' + dmenu_languages[language]["language_id"] + '" class="form-control name_' + dmenu_languages[language]["language_id"] + '" value="' + names[dmenu_languages[language]["language_id"]] + '" required>';
                                menuItemHTML += '</div>';
                            }

                            menuItemHTML += '<div class="input-group pull-left">';
                                menuItemHTML += '<div class="form-check checkbox">';
                                    menuItemHTML += '<input type="checkbox" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][names_hide]" id="' + menu + '-item-' + attrIdDepth + '-data-names_hide" class="form-check-input names_hide" value="1">';
                                    menuItemHTML += '<label for="' + menu + '-item-' + attrIdDepth + '-data-names_hide">' + dmenu_entry_name_hide + '</label>';
                                menuItemHTML += '</div>';
                            menuItemHTML += '</div>';

                        menuItemHTML += '</div>';
                    menuItemHTML += '</div>';

                    if ( seoDisplay ) {
                        menuItemHTML += '<div class="field row required">';
                            menuItemHTML += '<label class="col-sm-2 control-label col-form-label" for="' + menu + '-item-' + attrIdDepth + '-data-url-seo_' + dmenu_configLanguageID + '">' + dmenu_entry_url + '</label>';
                            menuItemHTML += '<div class="col-sm-10 module-dmenu_editor-item_title_languages item_url">';

                                for (language in dmenu_languages) {
                                    menuItemHTML += '<div class="input-group pull-left">';
                                        menuItemHTML += '<span class="input-group-text">';
                                            menuItemHTML += '<img src="language/' + dmenu_languages[language]["code"] + '/' + dmenu_languages[language]["code"] + '.png" title="' + dmenu_languages[language]["name"] + '" />';
                                        menuItemHTML += '</span>';

                                        menuItemHTML += '<input type="text" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][url][seo][' + dmenu_languages[language]["language_id"] + ']" id="' + menu + '-item-' + attrIdDepth + '-data-url-seo_' + dmenu_languages[language]["language_id"] + '" class="form-control url_seo_' + dmenu_languages[language]["language_id"] + '" value="" ' + fieldReadonly + '>';

                                        if (fieldReadonly) {
                                            menuItemHTML += '<i class="fas fa-lock" data-bs-toggle="tooltip" data-lock="' + dmenu_button_lock_tip + '" data-unlock="' + dmenu_button_unlock_tip + '" title="' + dmenu_button_unlock_tip + '"></i>';
                                        } else {
                                            menuItemHTML += '<i class="fas fa-unlock" data-bs-toggle="tooltip" data-lock="' + dmenu_button_lock_tip + '" data-unlock="' + dmenu_button_unlock_tip + '" title="' + dmenu_button_lock_tip + '"></i>';
                                        }
                                    menuItemHTML += '</div>';
                                }

                            menuItemHTML += '</div>';
                        menuItemHTML += '</div>';
                    }

                    menuItemHTML += '<div class="field row">';
                        menuItemHTML += '<label class="col-sm-2 control-label col-form-label" for="' + menu + '-item-' + attrIdDepth + '-data-target">' + dmenu_entry_target + '</label>';
                        menuItemHTML += '<div class="col-sm-10 module-dmenu_editor-item_field">';
                            menuItemHTML += '<select name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][target]" id="' + menu + '-item-' + attrIdDepth + '-data-target" class="form-select">';
                                menuItemHTML += '<option value="">' + dmenu_text_select_none + '</option>';
                                menuItemHTML += '<option value="_self">' + dmenu_text_target_self + '</option>';
                                menuItemHTML += '<option value="_blank">' + dmenu_text_target_blank + '</option>';
                                menuItemHTML += '<option value="_parent">' + dmenu_text_target_parent + '</option>';
                                menuItemHTML += '<option value="_top">' + dmenu_text_target_top + '</option>';
                            menuItemHTML += '</select>';
                        menuItemHTML += '</div>';
                    menuItemHTML += '</div>';

                    menuItemHTML += '<div class="field row">';
                        menuItemHTML += '<label class="col-sm-2 control-label col-form-label" for="' + menu + '-item-' + attrIdDepth + '-data-xfn">' + dmenu_entry_xfn + '</label>';

                        menuItemHTML += '<div class="col-sm-10 module-dmenu_editor-item_field">';
                            menuItemHTML += '<input name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][xfn]" id="' + menu + '-item-' + attrIdDepth + '-data-xfn" class="form-control" value="">';
                        menuItemHTML += '</div>';
                    menuItemHTML += '</div>';

                    menuItemHTML += '<div class="field row">';
                        menuItemHTML += '<label class="col-sm-2 control-label col-form-label" for="' + menu + '-item-' + attrIdDepth + '-data-class">' + dmenu_entry_class + '</label>';
                        menuItemHTML += '<div class="col-sm-10 module-dmenu_editor-item_field">';
                            menuItemHTML += '<input name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][class]" id="' + menu + '-item-' + attrIdDepth + '-data-class" class="form-control" value="">';
                        menuItemHTML += '</div>';
                    menuItemHTML += '</div>';

                    menuItemHTML += '<div class="field row">';
                        menuItemHTML += '<label class="col-sm-2 control-label col-form-label" for="' + menu + '-item-' + attrIdDepth + '-data-icon-image">' + dmenu_entry_icon + '</label>';
                        menuItemHTML += '<div class="col-sm-10 module-dmenu_editor-item_field">';
                            menuItemHTML += '<div class="card image module_dmenu_editor-placeholder">';
                                menuItemHTML += '<img src="' + dmenu_item_placeholder + '" alt="' + dmenu_entry_icon + '" title="' + dmenu_entry_icon + '" data-oc-placeholder="' + dmenu_item_placeholder + '" id="' + menu + '-item-' + attrIdDepth + '-data-icon-thumb" class="card-img-top">';
                                menuItemHTML += '<input type="hidden" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][icon][image]" value="" id="' + menu + '-item-' + attrIdDepth + '-data-icon-image" class="hidden">';

                                menuItemHTML += '<div class="card-body">';
                                    menuItemHTML += '<button type="button" data-oc-toggle="image" data-oc-target="#' + menu + '-item-' + attrIdDepth + '-data-icon-image" data-oc-thumb="#' + menu + '-item-' + attrIdDepth + '-data-icon-thumb" class="btn btn-primary btn-sm btn-block"><i class="fas fa-pencil-alt"></i> ' + dmenu_button_edit + '</button> ';
                                    menuItemHTML += '<button type="button" data-oc-toggle="clear" data-oc-target="#' + menu + '-item-' + attrIdDepth + '-data-icon-image" data-oc-thumb="#' + menu + '-item-' + attrIdDepth + '-data-icon-thumb" class="btn btn-warning btn-sm btn-block"><i class="fas fa-trash-alt"></i> ' + dmenu_button_clear + '</button>';
                                menuItemHTML += '</div>';
                            menuItemHTML += '</div>';
                        menuItemHTML += '</div>';
                    menuItemHTML += '</div>';

                    menuItemHTML += '<div>';
                        menuItemHTML += '<input type="hidden" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][url][link]" class="hidden" value="' + urlLink + '">';
                        menuItemHTML += '<input type="hidden" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][id]" class="hidden" value="' + id + '">';
                        menuItemHTML += '<input type="hidden" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][layout]" class="hidden" value="' + layout + '">';
                    menuItemHTML += '</div>';
                menuItemHTML += '</div>';
            menuItemHTML += '</div>';
        menuItemHTML += '</div>';

        menuItemHTML += '<div class="module-dmenu_editor-item_content_sortable">';
            menuItemHTML += '<div id="module_menu_' + menu + '_nested_sortable-' + attrIdDepth + '" class="module-menu_items_wrap_content nested-sortable"></div>';
        menuItemHTML += '</div>';

        // Return.
        return menuItemHTML;
    }

    // HTML Catalog Menu Item.
    function getCatalogMenuItem(layout, names, attrIdDepth, attrNameDepth, menu) {
        var menuItemHTML = '';

        menuItemHTML += '<div class="module-dmenu_editor-item">';
            menuItemHTML += '<label class="text-left module-dmenu_editor-item_title">';
                menuItemHTML += '<span class="text">' + dmenu_text_result_categories + '</span>';

                menuItemHTML += '<span class="buttons">';
                    menuItemHTML += '<span class="notice">' + dmenu_text_item_desc_catalog + '</span>';
                    menuItemHTML += '<a class="a_item_href"></a>';
                    menuItemHTML += '<i class="fas fa-trash-alt fa_row_remove" data-bs-toggle="tooltip" title="' + dmenu_button_remove_item_tip + '"></i>';
                    menuItemHTML += '<i class="fas fa-angle-down fa_arrow_open" data-bs-toggle="tooltip" title="' + dmenu_button_edit_item_tip + '"></i>';
                menuItemHTML += '</span>';
            menuItemHTML += '</label>';

            menuItemHTML += '<div class="module-dmenu_editor-item_content" style="display: none;">';
                menuItemHTML += '<div class="card-body">';
                    menuItemHTML += '<div class="row setting-category_menu">';
                        menuItemHTML += '<label class="col-sm-2 control-label col-form-label" for="' + menu + '-item-' + attrIdDepth + '-data-category_menu">' + dmenu_entry_category_menu + '</label>';

                        menuItemHTML += '<div class="col-sm-10 module-dmenu_editor-item_field">';
                            menuItemHTML += '<select name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][category_menu]" id="' + menu + '-item-' + attrIdDepth + '-data-category_menu" class="form-select">';
                                menuItemHTML += '<option value="1">' + dmenu_text_yes + '</option>';
                                menuItemHTML += '<option value="0" selected="selected">' + dmenu_text_no + '</option>';
                            menuItemHTML += '</select>';
                        menuItemHTML += '</div>';
                    menuItemHTML += '</div>';

                    menuItemHTML += '<div class="setting-category_menu_hidden_block hidden">';
                        menuItemHTML += '<div class="row setting-category_menu_title required">';
                            menuItemHTML += '<label class="col-sm-2 control-label col-form-label" for="' + menu + '-item-' + attrIdDepth + '-data-name_' + dmenu_configLanguageID + '">' + dmenu_entry_category_menu_title + '</label>';

                            menuItemHTML += '<div class="col-sm-10 module-dmenu_editor-item_field">';

                                for (language in dmenu_languages) {
                                    menuItemHTML += '<div class="input-group pull-left" style="margin-bottom: 5px;">';
                                        menuItemHTML += '<span class="input-group-text">';
                                            menuItemHTML += '<img src="language/' + dmenu_languages[language]["code"] + '/' + dmenu_languages[language]["code"] + '.png" title="' + dmenu_languages[language]["name"] + '" />';
                                        menuItemHTML += '</span>';

                                        menuItemHTML += '<input type="text" id="' + menu + '-item-' + attrIdDepth + '-data-name_' + dmenu_languages[language]["language_id"] + '" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][category_menu_names][' + dmenu_languages[language]["language_id"] + ']" class="form-control name_' + dmenu_languages[language]["language_id"] + '" value="' + names[dmenu_languages[language]["language_id"]] + '">';
                                    menuItemHTML += '</div>';
                                }

                            menuItemHTML += '</div>';
                        menuItemHTML += '</div>';

                        menuItemHTML += '<div class="row setting-category_menu_icon">';
                            menuItemHTML += '<label class="col-sm-2 control-label col-form-label" for="' + menu + '-item-' + attrIdDepth + '-data-icon-image">' + dmenu_entry_icon + '</label>';

                            menuItemHTML += '<div class="col-sm-10">';
                                menuItemHTML += '<div class="card image module_dmenu_editor-placeholder">';
                                    menuItemHTML += '<img src="' + dmenu_item_placeholder + '" alt="' + dmenu_entry_icon + '" title="' + dmenu_entry_icon + '" data-oc-placeholder="' + dmenu_item_placeholder + '" id="' + menu + '-item-' + attrIdDepth + '-data-icon-thumb" class="card-img-top">';
                                    menuItemHTML += '<input type="hidden" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][icon][image]" value="" id="' + menu + '-item-' + attrIdDepth + '-data-icon-image" class="hidden">';

                                    menuItemHTML += '<div class="card-body">';
                                        menuItemHTML += '<button type="button" data-oc-toggle="image" data-oc-target="#' + menu + '-item-' + attrIdDepth + '-data-icon-image" data-oc-thumb="#' + menu + '-item-' + attrIdDepth + '-data-icon-thumb" class="btn btn-primary btn-sm btn-block"><i class="fas fa-pencil-alt"></i> ' + dmenu_button_edit + '</button> ';
                                        menuItemHTML += '<button type="button" data-oc-toggle="clear" data-oc-target="#' + menu + '-item-' + attrIdDepth + '-data-icon-image" data-oc-thumb="#' + menu + '-item-' + attrIdDepth + '-data-icon-thumb" class="btn btn-warning btn-sm btn-block"><i class="fas fa-trash-alt"></i> ' + dmenu_button_clear + '</button>';
                                    menuItemHTML += '</div>';
                                menuItemHTML += '</div>';
                            menuItemHTML += '</div>';
                        menuItemHTML += '</div>';
                    menuItemHTML += '</div>';
                menuItemHTML += '</div>';
            menuItemHTML += '</div>';
        menuItemHTML += '</div>';

        menuItemHTML += '<div>';
            menuItemHTML += '<input type="hidden" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][url][link]" class="hidden" value="">';
            menuItemHTML += '<input type="hidden" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][id]" class="hidden" value="0">';
            menuItemHTML += '<input type="hidden" name="module_dmenu_editor_items_' + menu + attrNameDepth + '[data][layout]" class="hidden" value="' + layout + '">';
        menuItemHTML += '</div>';

        // Return.
        return menuItemHTML;
    }

    // HTML Missing message.
    function displayMessageMissing() {
        var textMissing = '';

        textMissing += '<div class="not_repair sortable_filtered">';
            textMissing += '<div class="module-menu_items_missing_text">' + dmenu_text_menu_item_missing + '</div>';
        textMissing += '</div>';

        // Return.
        return textMissing;
    }
});