// Rich Text Editor for Django - Fixed Version Based on toolbars.html
class DjangoRichTextEditor {
    constructor() {
        this.editor = null;
        this.hiddenField = null;
        this.formatSelect = null;
        this.linkModal = null;
        this.linkUrl = null;
        this.linkText = null;
        this.imageFileInput = null;
        
        this.lastFontSize = '4';
        this.savedSelection = null;
        
        this.init();
    }

    init() {
        this.editor = document.getElementById('editor');
        this.hiddenField = document.getElementById('hidden-content');
        this.formatSelect = document.querySelector('.font-size-selector');
        this.linkModal = document.getElementById('linkModal');
        this.linkUrl = document.getElementById('linkUrl');
        this.linkText = document.getElementById('linkText');
        this.imageFileInput = document.getElementById('inline-image-input');

        if (!this.editor) return;

        this.initializeEditor();
        this.attachEventListeners();
    }

    initializeEditor() {
        if (this.hiddenField && this.hiddenField.value.trim()) {
            this.editor.innerHTML = this.hiddenField.value;
        }
        
        this.updatePlaceholder();
        
        this.editor.addEventListener('focus', () => this.updatePlaceholder());
        this.editor.addEventListener('blur', () => this.updatePlaceholder());
        this.editor.addEventListener('input', () => {
            this.updatePlaceholder();
            this.updateToolbarState();
            this.updateHiddenField();
        });
        
        setTimeout(() => this.updateToolbarState(), 100);
    }

    updatePlaceholder() {
        const isEmpty = this.editor.textContent.trim() === '';
        if (isEmpty && !this.editor.matches(':focus')) {
            this.editor.setAttribute('data-empty', 'true');
        } else {
            this.editor.removeAttribute('data-empty');
        }
    }

    updateHiddenField() {
        if (this.hiddenField) {
            this.hiddenField.value = this.editor.innerHTML;
        }
    }

    saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            this.savedSelection = selection.getRangeAt(0).cloneRange();
        }
    }

    restoreSelection() {
        if (this.savedSelection) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.savedSelection);
            this.editor.focus();
        }
    }

    insertHTMLAtCursor(html) {
        this.editor.focus();
        try {
            const used = document.execCommand('insertHTML', false, html);
            if (used) { 
                this.updateToolbarState(); 
                this.updateHiddenField();
                return; 
            }
        } catch (e) {}

        const selection = window.getSelection();
        if (!selection.rangeCount) {
            const range = document.createRange();
            range.selectNodeContents(this.editor);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        const range = selection.getRangeAt(0);
        range.deleteContents();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }

        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        this.updateToolbarState();
        this.updateHiddenField();
    }

    attachEventListeners() {
        if (this.formatSelect) {
            this.formatSelect.addEventListener('change', () => {
                const value = this.formatSelect.value;
                this.formatBlock(value);
                this.formatSelect.value = value;
            });
        }

        document.addEventListener('selectionchange', () => {
            if (document.activeElement === this.editor) {
                this.updateToolbarState();
            }
        });

        if (this.editor) {
            this.editor.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key.toLowerCase()) {
                        case 'b': e.preventDefault(); this.execCommand('bold'); break;
                        case 'i': e.preventDefault(); this.execCommand('italic'); break;
                        case 'u': e.preventDefault(); this.execCommand('underline'); break;
                    }
                }
            });

            this.editor.addEventListener('paste', (e) => this.handlePaste(e));
        }

        if (this.imageFileInput) {
            this.imageFileInput.addEventListener('change', (e) => this.handleImageFile(e));
        }

        if (this.linkUrl) {
            this.linkUrl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.linkText) this.linkText.focus();
                }
            });
        }
        
        if (this.linkText) {
            this.linkText.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.insertLink();
                }
            });
        }
    }

    execCommand(command, value = null) {
        this.editor.focus();
        document.execCommand(command, false, value);
        this.updateToolbarState();
        this.updateHiddenField();
    }

    formatBlock(scale) {
        this.editor.focus();
        document.execCommand('fontSize', false, scale);
        this.lastFontSize = scale;
        this.updateToolbarState();
        this.updateHiddenField();
    }

    insertBlockquote() {
        this.editor.focus();
        const parent = this.getParentElement();
        if (parent && parent.tagName === 'BLOCKQUOTE') {
            const frag = document.createDocumentFragment();
            while (parent.firstChild) {
                frag.appendChild(parent.firstChild);
            }
            parent.parentNode.insertBefore(frag, parent);
            parent.parentNode.removeChild(parent);
            const sel = window.getSelection();
            sel.removeAllRanges();
            const range = document.createRange();
            let anchor = frag.lastChild || parent.nextSibling || parent.parentNode;
            if (anchor && anchor.nodeType === Node.TEXT_NODE) {
                range.setStart(anchor, anchor.textContent.length);
            } else if (anchor && anchor.nodeType === Node.ELEMENT_NODE) {
                range.selectNodeContents(anchor);
                range.collapse(false);
            } else {
                range.setStart(this.editor, this.editor.childNodes.length);
            }
            sel.addRange(range);
            this.updateToolbarState();
            this.updateHiddenField();
            return;
        }
        this.execCommand('formatBlock', 'blockquote');
    }

    openLinkModal() {
        if (!this.linkModal) return;
        
        this.saveSelection();
        const linkData = this.getSelectedLinkData();

        if (linkData) {
            this.linkUrl.value = linkData.url || '';
            this.linkText.value = linkData.text || '';
        } else {
            const selection = window.getSelection();
            const selectedText = selection.toString();
            this.linkText.value = selectedText || '';
            this.linkUrl.value = '';
        }

        this.linkModal.style.display = 'flex';
        this.linkUrl.focus();
    }

    closeLinkModal() {
        if (!this.linkModal) return;
        this.linkModal.style.display = 'none';
        if (this.linkUrl) this.linkUrl.value = '';
        if (this.linkText) this.linkText.value = '';
        this.restoreSelection();
    }

    insertLink() {
        if (!this.linkUrl || !this.linkText) return;
        
        const url = this.linkUrl.value.trim();
        const linkText = this.linkText.value.trim() || url;
        
        if (url && url !== '') {
            this.restoreSelection();
            const link = `<a href="${this.escapeHtml(url)}" target="_blank">${this.escapeHtml(linkText)}</a>`;
            this.insertHTMLAtCursor(link);
            this.closeLinkModal();
        }
    }

    insertInlineImage() {
        if (this.imageFileInput) {
            this.imageFileInput.click();
        }
    }

    handleImageFile(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgHtml = `<img src="${e.target.result}" alt="${this.escapeHtml(file.name)}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">`;

                const linkEl = this.getAncestorLink();
                if (linkEl) {
                    const wrapperHtml = `<div><img src="${e.target.result}" alt="${this.escapeHtml(file.name)}" style="max-width: 100%; height: auto;"></div>`;
                    try {
                        const range = document.createRange();
                        range.setStartBefore(linkEl);
                        range.collapse(true);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                        document.execCommand('insertHTML', false, wrapperHtml);
                        this.updateToolbarState();
                        this.updateHiddenField();
                    } catch (ex) {
                        const wrapper = document.createElement('div');
                        const imgNode = document.createElement('img');
                        imgNode.src = e.target.result;
                        imgNode.alt = file.name;
                        imgNode.style.maxWidth = '100%';
                        imgNode.style.height = 'auto';
                        wrapper.appendChild(imgNode);
                        linkEl.parentNode.insertBefore(wrapper, linkEl);
                        this.updateToolbarState();
                        this.updateHiddenField();
                    }
                } else {
                    this.insertHTMLAtCursor(imgHtml);
                }
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    }

    handlePaste(event) {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const items = clipboardData.items;
        if (!items) return;

        // Check if any clipboard item is an image
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                event.preventDefault(); // Prevent default paste behavior for images
                
                const file = item.getAsFile();
                if (file) {
                    this.handlePastedImageFile(file);
                }
                return;
            }
        }
        // If no image found, allow default paste behavior for text/other content
    }

    handlePastedImageFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Generate a filename for the pasted image
                const timestamp = new Date().getTime();
                const extension = file.type.split('/')[1] || 'png';
                const filename = `pasted-image-${timestamp}.${extension}`;
                
                const imgHtml = `<img src="${e.target.result}" alt="${this.escapeHtml(filename)}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">`;

                const linkEl = this.getAncestorLink();
                if (linkEl) {
                    const wrapperHtml = `<div><img src="${e.target.result}" alt="${this.escapeHtml(filename)}" style="max-width: 100%; height: auto;"></div>`;
                    try {
                        const range = document.createRange();
                        range.setStartBefore(linkEl);
                        range.collapse(true);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                        document.execCommand('insertHTML', false, wrapperHtml);
                        this.updateToolbarState();
                        this.updateHiddenField();
                    } catch (ex) {
                        const wrapper = document.createElement('div');
                        const imgNode = document.createElement('img');
                        imgNode.src = e.target.result;
                        imgNode.alt = filename;
                        imgNode.style.maxWidth = '100%';
                        imgNode.style.height = 'auto';
                        wrapper.appendChild(imgNode);
                        linkEl.parentNode.insertBefore(wrapper, linkEl);
                        this.updateToolbarState();
                        this.updateHiddenField();
                    }
                } else {
                    this.insertHTMLAtCursor(imgHtml);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    updateToolbarState() {
        this.updateFontSizeDropdown();
        
        const buttons = document.querySelectorAll('.toolbar-btn[data-command]');
        buttons.forEach(btn => {
            const command = btn.getAttribute('data-command');
            if (command && command !== 'quote') {
                try {
                    btn.classList.toggle('active', document.queryCommandState(command));
                } catch (e) {}
            }
        });

        const quoteBtn = document.querySelector('.toolbar-btn[data-command="quote"]');
        if (quoteBtn) {
            const parent = this.getParentElement();
            quoteBtn.classList.toggle('active', parent && parent.tagName === 'BLOCKQUOTE');
        }
    }

    // FIXED: More robust font-size detection from toolbars.html
    updateFontSizeDropdown() {
        if (!this.formatSelect) return;
        
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            this.formatSelect.value = this.lastFontSize;
            return;
        }

        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

        // 1) look up ancestors for <font size="..."> or inline style
        let el = node;
        while (el && el !== this.editor) {
            if (el.tagName === 'FONT' && el.getAttribute('size')) {
                this.formatSelect.value = el.getAttribute('size');
                this.lastFontSize = el.getAttribute('size');
                return;
            }
            if (el.nodeType === Node.ELEMENT_NODE && el.style && el.style.fontSize) {
                const mapped = this.mapFontSizeToDropdownValue(el.style.fontSize);
                if (mapped) { 
                    this.formatSelect.value = mapped; 
                    this.lastFontSize = mapped; 
                    return; 
                }
            }
            el = el.parentElement;
        }

        // 2) If collapsed caret, inspect nearby text nodes / siblings for a font size we can use
        if (range.collapsed) {
            const startContainer = range.startContainer;
            const startOffset = range.startOffset;

            // If inside a text node, prefer its parent computed style
            if (startContainer.nodeType === Node.TEXT_NODE) {
                const parent = startContainer.parentElement;
                if (parent) {
                    const comp = window.getComputedStyle(parent);
                    const mapped = this.mapFontSizeToDropdownValue(comp.fontSize);
                    if (mapped) { 
                        this.formatSelect.value = mapped; 
                        this.lastFontSize = mapped; 
                        return; 
                    }
                }

                // if caret is at the very start, look for previous siblings
                if (startOffset === 0) {
                    let prev = startContainer.previousSibling;
                    while (prev) {
                        if (prev.nodeType === Node.TEXT_NODE && prev.textContent.trim().length > 0) {
                            const comp = window.getComputedStyle(prev.parentElement);
                            const mapped2 = this.mapFontSizeToDropdownValue(comp.fontSize);
                            if (mapped2) { 
                                this.formatSelect.value = mapped2; 
                                this.lastFontSize = mapped2; 
                                return; 
                            }
                        } else if (prev.nodeType === Node.ELEMENT_NODE) {
                            const comp = window.getComputedStyle(prev);
                            const mapped3 = this.mapFontSizeToDropdownValue(comp.fontSize);
                            if (mapped3) { 
                                this.formatSelect.value = mapped3; 
                                this.lastFontSize = mapped3; 
                                return; 
                            }
                        }
                        prev = prev.previousSibling;
                    }
                }
            } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
                // If caret is inside an element node, check the child just before caret
                const idx = Math.max(0, startOffset - 1);
                const child = startContainer.childNodes[idx];
                if (child) {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
                        const comp = window.getComputedStyle(child.parentElement);
                        const mapped = this.mapFontSizeToDropdownValue(comp.fontSize);
                        if (mapped) { 
                            this.formatSelect.value = mapped; 
                            this.lastFontSize = mapped; 
                            return; 
                        }
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        const comp = window.getComputedStyle(child);
                        const mapped2 = this.mapFontSizeToDropdownValue(comp.fontSize);
                        if (mapped2) { 
                            this.formatSelect.value = mapped2; 
                            this.lastFontSize = mapped2; 
                            return; 
                        }
                    }
                }
            }
        }

        // 3) fallback: computed style of the nearest anchorNode parent
        try {
            const anchorParent = selection.anchorNode && selection.anchorNode.parentElement ? selection.anchorNode.parentElement : this.editor;
            const computed = window.getComputedStyle(anchorParent);
            const mapped = this.mapFontSizeToDropdownValue(computed.fontSize);
            if (mapped) { 
                this.formatSelect.value = mapped; 
                this.lastFontSize = mapped; 
                return; 
            }
        } catch (e) {
            // ignore
        }

        // default
        this.formatSelect.value = this.lastFontSize || '4';
    }

    mapFontSizeToDropdownValue(fontSize) {
        if (!fontSize) return null;
        if (fontSize.includes('px')) {
            const pixelSize = parseInt(fontSize, 10);
            // Updated mapping: Small=2, Normal=4, Normal+=5, Large=6
            if (pixelSize <= 12) return '2';      // Small
            if (pixelSize <= 16) return '4';      // Normal (default browser size ~16px)
            if (pixelSize <= 18) return '5';      // Normal+
            return '6';                           // Large (18px+)
        }
        return null;
    }

    getParentElement() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            let element = selection.getRangeAt(0).commonAncestorContainer;
            if (element.nodeType === Node.TEXT_NODE) element = element.parentElement;
            while (element && element !== this.editor) {
                if (['FONT', 'P', 'DIV', 'BLOCKQUOTE'].includes(element.tagName)) {
                    return element;
                }
                element = element.parentElement;
            }
        }
        return null;
    }

    getSelectedLinkData() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;
        
        const range = selection.getRangeAt(0);

        // Case 1: Cursor is inside a link (collapsed selection)
        if (range.collapsed) {
            let element = range.startContainer;
            if (element.nodeType === Node.TEXT_NODE) {
                element = element.parentElement;
            }
            // Walk up the DOM tree to find a link
            while (element && element !== this.editor) {
                if (element.tagName === 'A') {
                    return {
                        element: element,
                        url: element.getAttribute('href') || '',
                        text: element.textContent || ''
                    };
                }
                element = element.parentElement;
            }
        }
        
        // Case 2: Text is selected - check if it's a link or contains a link
        else {
            // Get all elements in the selection
            const container = range.commonAncestorContainer;
            let currentElement = container;
            if (currentElement.nodeType === Node.TEXT_NODE) {
                currentElement = currentElement.parentElement;
            }
            // Check if we're selecting within a single link
            while (currentElement && currentElement !== this.editor) {
                if (currentElement.tagName === 'A') {
                    return {
                        element: currentElement,
                        url: currentElement.getAttribute('href') || '',
                        text: currentElement.textContent || ''
                    };
                }
                currentElement = currentElement.parentElement;
            }
            
            // Check if selection contains exactly one link element
            const selectedContent = range.cloneContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(selectedContent);
            const links = tempDiv.querySelectorAll('a');
            
            if (links.length === 1) {
                const linkText = links[0].textContent;
                const linkHref = links[0].getAttribute('href') || '';
                
                // Find the corresponding link in the actual DOM
                const allLinks = this.editor.querySelectorAll('a');
                for (let link of allLinks) {
                    if (link.textContent === linkText && link.getAttribute('href') === linkHref) {
                        return {
                            element: link,
                            url: linkHref,
                            text: linkText
                        };
                    }
                }
            }
        }
        
        return null;
    }

    getAncestorLink() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;
        let node = selection.getRangeAt(0).startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        while (node && node !== this.editor) {
            if (node.tagName === 'A') return node;
            node = node.parentElement;
        }
        return null;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global instance
let richTextEditor = null;

// Global functions for Django template compatibility
window.formatDoc = function(command, value = null) {
    if (richTextEditor) {
        if (command === 'fontSize') {
            richTextEditor.formatBlock(value);
        } else {
            richTextEditor.execCommand(command, value);
        }
    }
};

window.insertBlockquote = function() {
    if (richTextEditor) {
        richTextEditor.insertBlockquote();
    }
};

window.openLinkModal = function() {
    if (richTextEditor) {
        richTextEditor.openLinkModal();
    }
};

window.closeLinkModal = function() {
    if (richTextEditor) {
        richTextEditor.closeLinkModal();
    }
};

window.insertLink = function() {
    if (richTextEditor) {
        richTextEditor.insertLink();
    }
};

window.insertInlineImage = function() {
    if (richTextEditor) {
        richTextEditor.insertInlineImage();
    }
};

window.previewImageBlogCover = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const uploadArea = document.getElementById('upload-area');
            const previewArea = document.getElementById('preview-area');
            const imagePreview = document.getElementById('image-preview');
            
            if (uploadArea && previewArea && imagePreview) {
                uploadArea.classList.add('hidden');
                previewArea.classList.remove('hidden');
                imagePreview.src = e.target.result;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    richTextEditor = new DjangoRichTextEditor();
});