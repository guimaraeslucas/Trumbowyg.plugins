/**
 * Trumbowyg - Spellchecker Plugin
 *
 * A plugin for Trumbowyg Editor that uses Bootstrap 5, Enchant 2, and PHP for text checking.
 * The dictionary must be properly configured in Enchant 2 and the PHP extension must be active on the server.
 * Trumbowyg is a program of <alex-d.github.io/Trumbowyg>
 *
 * @author  Lucas Guimarães <https://github.com/guimaraeslucas/>
 *
 * Copyright 2025, Lucas Guimarães e G3Pix Ltda <https://g3pix.com.br>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

(function ($) {
    'use strict';

    const ERROR_CLASS = 'trumbowyg-spell-error';
    const ERROR_TAG = 'span';

    $.extend(true, $.trumbowyg, {
        plugins: {
            spellchecker: {
                init: function (trumbowyg) {
                    this.trumbowyg = trumbowyg;
                    this.checkTimeout = null;
                    this.contextMenu = null;

                    this.opts = $.extend(true, {}, {
                        checkUrl: 'spell_api.php?action=check',
                        suggestUrl: 'spell_api.php?action=suggest',
                        checkDelay: 1500, // 1,5 secs to wait
                        minWordLength: 3,
                    }, trumbowyg.o.plugins.spellchecker || {});

                    this.waitForEditor();
                },

                waitForEditor: function () {
                    var plugin = this;
                    if (plugin.trumbowyg && plugin.trumbowyg.$ed && plugin.trumbowyg.$ed.length > 0) {
                        plugin.bindEvents();
                    } else {
                        setTimeout(function () { plugin.waitForEditor(); }, 100);
                    }
                },

                bindEvents: function () {
                    var plugin = this;
                    var tbw = plugin.trumbowyg;

                    tbw.$ed.on('keyup.trumbowyg-spellchecker', function () {
                        clearTimeout(plugin.checkTimeout);
                        plugin.checkTimeout = setTimeout(function () {
                            plugin.runCheck();
                        }, plugin.opts.checkDelay);
                    });

                    tbw.$ed.on('contextmenu.trumbowyg-spellchecker', function (e) {
                        if ($(e.target).hasClass(ERROR_CLASS)) {
                            e.preventDefault();
                            plugin.showContextMenu(e.target);
                        }
                    });

                    $(document).on('click.trumbowyg-spellchecker-document', function (e) {

                        if (plugin.contextMenu && $(e.target).closest('.trumbowyg-spell-context-menu').length === 0) {
                            plugin.hideContextMenu();
                        }
                    });

                    tbw.$box.on('tbw:sync', function () {
                        plugin.cleanupErrors();
                    });
                },

                runCheck: function () {
                    var plugin = this;
                    var text = plugin.trumbowyg.$ed.text();

                    if (!text.trim()) {
                        plugin.cleanupErrors();
                        return;
                    }

                    $.ajax({
                        url: plugin.opts.checkUrl,
                        type: 'POST',
                        data: { text: text },
                        dataType: 'json',
                        success: function (errors) {
                            plugin.cleanupErrors();
                            if (errors && errors.length > 0) {
                                plugin.highlightErrors(errors);
                            }
                        }
                    });
                },

                highlightErrors: function (errors) {
                    var plugin = this;
                    var editor = plugin.trumbowyg.$ed[0];

                    var errorsPattern = errors.map(function (error) {
                        return plugin.escapeRegExp(error);
                    }).join('|');

                    if (!errorsPattern) return;

                    var globalRegex = new RegExp('\\b(' + errorsPattern + ')\\b', 'gi');

                    var treeWalker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
                    var textNodes = [];
                    while (treeWalker.nextNode()) {
                        textNodes.push(treeWalker.currentNode);
                    }

                    textNodes.forEach(function (node) {
                        if ($(node).parent(ERROR_TAG + '.' + ERROR_CLASS).length > 0) {
                            return;
                        }

                        var text = node.nodeValue;

                        if (!globalRegex.test(text)) {
                            return;
                        }
                        globalRegex.lastIndex = 0;

                        var fragment = document.createDocumentFragment();
                        var lastIndex = 0;
                        var match;

                        while ((match = globalRegex.exec(text)) !== null) {
                            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));

                            var errorNode = document.createElement(ERROR_TAG);
                            errorNode.className = ERROR_CLASS;
                            errorNode.appendChild(document.createTextNode(match[0]));
                            fragment.appendChild(errorNode);

                            lastIndex = globalRegex.lastIndex;
                        }

                        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));

                        node.parentNode.replaceChild(fragment, node);
                    });
                },

                showContextMenu: function (errorElement) {
                    var plugin = this;
                    var word = $(errorElement).text();

                    plugin.hideContextMenu(); 

                    $.ajax({
                        url: plugin.opts.suggestUrl,
                        type: 'GET',
                        data: { word: word },
                        dataType: 'json',
                        success: function (suggestions) {
                            var menu = $(`
                                <div class="trumbowyg-spell-context-menu dropdown-menu shadow-sm show" style="position: absolute;">
                                    <button type="button" class="btn-close btn-sm" aria-label="Close" style="position: absolute; width: 0.5em; height: 0.5em;top: 8px; right: 8px; padding: 0.25rem 0.5rem; background: transparent var(--bs-btn-close-bg) center/0.5em auto no-repeat"></button>
                                </div>
                            `);

                            if (suggestions && suggestions.length > 0) {
                                suggestions.slice(0, 5).forEach(function (suggestion) {
                                    var item = $('<a class="dropdown-item" href="#" style="font-size: 0.7em"></a>').text(suggestion);
                                    item.on('click', function (e) {
                                        e.preventDefault();
                                        plugin.correctError(errorElement, suggestion);
                                        plugin.hideContextMenu();
                                    });
                                    menu.append(item);
                                });
                            } else {
                                menu.append('<span class="dropdown-item-text text-muted px-3"><small>❓</small></span>');
                            }


                            menu.find('.btn-close').on('click', function (e) {
                                e.preventDefault();
                                plugin.hideContextMenu();
                            });

                            $('body').append(menu);
                            plugin.contextMenu = menu;

                            var pos = $(errorElement).offset();
                            menu.css({
                                top: pos.top + $(errorElement).height(),
                                left: pos.left,
                                zIndex: 1052
                            });
                        }
                    });
                },

                hideContextMenu: function () {
                    if (this.contextMenu) {
                        this.contextMenu.remove();
                        this.contextMenu = null;
                    }
                },

                correctError: function (errorElement, correction) {
                    var textNode = document.createTextNode(correction + ' ');
                    $(errorElement).replaceWith(textNode);
                    this.trumbowyg.syncCode();
                },

                cleanupErrors: function () {
                    var plugin = this;
                    plugin.trumbowyg.$ed.find(ERROR_TAG + '.' + ERROR_CLASS).each(function () {
                        $(this).replaceWith($(this).text());
                    });
                    plugin.trumbowyg.$ed[0].normalize();
                },

                escapeRegExp: function (string) {
                    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }
            }
        }
    });
})(jQuery);
