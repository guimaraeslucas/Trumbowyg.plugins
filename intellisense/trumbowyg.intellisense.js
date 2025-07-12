(function ($) {
    'use strict';

    // Key codes
    var KC_BACKSPACE = 8,
        KC_TAB = 9,
        KC_ENTER = 13,
        KC_UP = 38,
        KC_DOWN = 40,
        KC_ESC = 27;

    $.extend(true, $.trumbowyg, {
        plugins: {
            intellisense: {
                // Plugin initialization
                init: function (trumbowyg) {
                    this.trumbowyg = trumbowyg;
                    this.menu = null;
                    this.isActive = false;
                    this.searchTerm = '';
                    this.searchCache = {}; // Cache to avoid repeated searches
                    this._debounceTimeout = null;


                    this.opts = $.extend(true, {}, {
                        trigger: '/',
                        source: '/api/search-report-templates', // API endpoint
                        optional_query: null, // Optional query
                        selectTemplate: function (item) {
                            return item.content || '';
                        },
                        renderTemplate: function (item) {
                            return `<div>${item.title}</div>`;
                        }
                    }, trumbowyg.o.plugins.intellisense || {});

                    this.waitForEditor();
                },

                waitForEditor: function () {
                    var plugin = this;
                    var tbw = plugin.trumbowyg;
                    if (tbw && tbw.$ed && tbw.$ed.length > 0) {
                        plugin.bindEvents();
                    } else {
                        setTimeout(function () {
                            plugin.waitForEditor();
                        }, 100); 
                    }
                },

                   bindEvents: function () {
                    var plugin = this;
                    var tbw = plugin.trumbowyg;

                    tbw.$ed.on('keyup.trumbowyg-intellisense', function (e) {
                        if (e.which === KC_ENTER || e.which === KC_TAB || e.which === KC_ESC) {
                            if (plugin.isActive) {
                                e.preventDefault();
                                return;
                            }
                        }
                        plugin.handleKeyup(e);
                    });

                    tbw.$ed.on('keydown.trumbowyg-intellisense', function (e) {
                        if (!plugin.isActive) return;

                        switch (e.which) {
                            case KC_UP:
                            case KC_DOWN:
                                e.preventDefault();
                                plugin.navigateMenu(e.which === KC_UP ? 'up' : 'down');
                                break;
                            case KC_ENTER:
                            case KC_TAB:
                                e.preventDefault();
                                plugin.selectActiveItem();
                                break;
                            case KC_ESC:
                                e.preventDefault();
                                plugin.hideMenu();
                                break;
                            case KC_BACKSPACE:
                                // Close menu if the search term becomes empty
                                if (plugin.searchTerm.length <= 1) {
                                    plugin.hideMenu();
                                }
                                break;
                        }
                    });

                       tbw.$ed.on('blur.trumbowyg-intellisense', function () {
                        setTimeout(function () {
                            if (plugin.menu && !plugin.menu.is(':focus-within')) {
                                plugin.hideMenu();
                            }
                        }, 200);
                    });
                },

                handleKeyup: function (e) {
                    var selection = this.trumbowyg.doc.getSelection();
                    if (selection.rangeCount === 0) return;

                    var range = selection.getRangeAt(0);
                    var text = range.startContainer.textContent.substring(0, range.startOffset);
                    var lastTriggerIndex = text.lastIndexOf(this.opts.trigger);

                    if (lastTriggerIndex === -1) {
                        this.hideMenu();
                        return;
                    }

                    var prevChar = text.substring(lastTriggerIndex - 1, lastTriggerIndex);
                    if (lastTriggerIndex > 0 && prevChar.trim() !== '' && !['<p>', '&nbsp;'].includes(prevChar)) {
                        this.hideMenu();
                        return;
                    }

                    this.searchTerm = text.substring(lastTriggerIndex + 1);

                    if (/\s/.test(this.searchTerm)) {
                        this.hideMenu();
                        return;
                    }

                    this.trumbowyg.saveRange();

                    this.showMenu();

                },

                showMenu: function () {
                    var plugin = this;
                    if (!plugin.menu) {
                        plugin.menu = $(`
                            <div class="trumbowyg-intellisense-menu dropdown-menu shadow" style="width: 300px;">
                                <div class="p-2">
                                    <input type="text" class="form-control form-control-sm" placeholder="">
                                </div>
                                <div class="list-group list-group-flush small p-1" style="max-height: 250px; overflow-y: auto;"></div>
                            </div>
                        `).appendTo('body');

                        plugin.menu.find('input').on('keyup', function (e) {
                            if (e.which === KC_UP || e.which === KC_DOWN || e.which === KC_ENTER || e.which === KC_ESC) {
                                return; 
                            }
                            plugin.fetchData($(this).val());
                        });

                        plugin.menu.on('click', '.list-group-item', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            plugin.selectItem($(this).data('item-data'));
                        });
                    }

                    if (this.isActive) return;

                    this.isActive = true;
                    plugin.menu.addClass('show');
                    plugin.menu.find('.list-group').html('<div class="list-group-item text-muted">Digite para buscar...</div>');

                    var range = this.trumbowyg.doc.getSelection().getRangeAt(0).cloneRange();
                    range.collapse(true);
                    var marker = this.trumbowyg.doc.createElement('span');
                    range.insertNode(marker);
                    var rect = marker.getBoundingClientRect();
                    marker.parentNode.removeChild(marker);

                    var editorRect = this.trumbowyg.$box[0].getBoundingClientRect();
                    plugin.menu.css({
                        top: rect.bottom + window.scrollY + 5,
                        left: rect.left + window.scrollX,
                        position: 'absolute', 
                        zIndex: 1051 
                    });

                    setTimeout(() => plugin.menu.find('input').focus(), 100);
                },

                hideMenu: function () {
                    if (!this.isActive) return;
                    this.isActive = false;
                    this.searchTerm = '';
                    if (this.menu) {
                        this.menu.removeClass('show');
                        this.menu.find('input').val('');
                    }
                },

                fetchData: function (query) {
                    var plugin = this;
                    clearTimeout(plugin._debounceTimeout);

                    plugin._debounceTimeout = setTimeout(function () {
                        var cacheKey = query + '|' + (plugin.opts.optional_query || '');
                        if (plugin.searchCache[cacheKey]) {
                            plugin.populateMenu(plugin.searchCache[cacheKey]);
                            return;
                        }

                        var requestData = {
                            term: query
                        };
                        if (plugin.opts.optional_query) {
                            requestData.clinic_procedure_id = plugin.opts.optional_query;
                        }

                        $.ajax({
                            url: plugin.opts.source,
                            type: 'GET',
                            data: requestData,
                            dataType: 'json',
                            success: function (data) {
                                plugin.searchCache[cacheKey] = data;
                                plugin.populateMenu(data);
                            },
                            error: function () {
                                plugin.populateMenu([]);
                            }
                        });
                    }, 350); 
                },

                populateMenu: function (items) {
                    if (!this.isActive) return;
                    var plugin = this;
                    var list = plugin.menu.find('.list-group');
                    list.empty();

                    if (items && items.length > 0) {
                        items.forEach(function (item) {
                            var $itemEl = $(`<a href="#" class="list-group-item list-group-item-action p-2"></a>`);
                            $itemEl.html(plugin.opts.renderTemplate(item));
                            $itemEl.data('item-data', item);
                            list.append($itemEl);
                        });

                    } else {
                        list.html('<div class="list-group-item text-muted"></div>');
                    }
                },

                selectItem: function (item) {
                    var plugin = this;
                    var contentToInsert = plugin.opts.selectTemplate(item);

                    plugin.trumbowyg.restoreRange();

                    var range = plugin.trumbowyg.doc.getSelection().getRangeAt(0);

                    var text = range.startContainer.textContent;
                    var startOffset = text.lastIndexOf(plugin.opts.trigger, range.startOffset);

                    if (startOffset === -1) {
                        plugin.hideMenu();
                        return;
                    }

                    range.setStart(range.startContainer, startOffset);

                    range.setEnd(range.startContainer, startOffset + plugin.opts.trigger.length + plugin.searchTerm.length);
                    range.deleteContents();

                    plugin.trumbowyg.execCmd('insertHTML', contentToInsert);
                    plugin.hideMenu();
                },

                navigateMenu: function (direction) {
                    var $active = this.menu.find('.list-group-item.active');
                    var $newItem;

                    if ($active.length === 0) {
                        $newItem = this.menu.find('.list-group-item:first-child');
                    } else {
                        $newItem = (direction === 'down') ? $active.next('.list-group-item') : $active.prev('.list-group-item');
                    }

                    if ($newItem.length > 0) {
                        $active.removeClass('active');
                        $newItem.addClass('active');
                        var list = this.menu.find('.list-group');
                        list.scrollTop(list.scrollTop() + $newItem.position().top - list.height() / 2 + $newItem.height() / 2);
                    }
                },

                selectActiveItem: function () {
                    var $active = this.menu.find('.list-group-item.active');
                    if ($active.length > 0) {
                        this.selectItem($active.data('item-data'));
                    }
                }
            }
        }
    });
})(jQuery);
