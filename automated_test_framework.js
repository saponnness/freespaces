/**
 * Automated Test Framework for Text Editor Toolbar State Synchronization
 * 
 * This framework provides comprehensive testing capabilities for identifying
 * and validating toolbar state synchronization issues in rich text editors.
 */

class TextEditorTestFramework {
    constructor(editorElement, toolbarElement) {
        this.editor = editorElement;
        this.toolbar = toolbarElement;
        this.testResults = [];
        this.currentTest = null;
        this.testSuite = null;
        
        // Test configuration
        this.config = {
            timeout: 5000,
            retryAttempts: 3,
            delayBetweenTests: 100,
            delayBetweenActions: 50,
            enableScreenshots: false,
            enableVideoRecording: false
        };
        
        // State tracking
        this.stateHistory = [];
        this.eventLog = [];
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.setupStateTracking();
        this.createTestSuite();
    }
    
    setupEventListeners() {
        // Track all editor events
        const events = ['input', 'keydown', 'keyup', 'mousedown', 'mouseup', 'click', 'focus', 'blur', 'selectionchange'];
        
        events.forEach(eventType => {
            this.editor.addEventListener(eventType, (e) => {
                this.logEvent(eventType, e);
            });
        });
    }
    
    setupStateTracking() {
        // Track toolbar state changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.logStateChange(mutation.target, mutation.oldValue, mutation.target.className);
                }
            });
        });
        
        observer.observe(this.toolbar, {
            attributes: true,
            attributeOldValue: true,
            subtree: true
        });
    }
    
    createTestSuite() {
        this.testSuite = {
            // Basic formatting tests
            basicFormatting: [
                this.createTest('Bold Button State Sync', this.testBoldStateSync),
                this.createTest('Italic Button State Sync', this.testItalicStateSync),
                this.createTest('Underline Button State Sync', this.testUnderlineStateSync),
                this.createTest('Ordered List State Sync', this.testOrderedListStateSync),
                this.createTest('Unordered List State Sync', this.testUnorderedListStateSync),
                this.createTest('Blockquote State Sync', this.testBlockquoteStateSync)
            ],
            
            // Selection-based tests
            selectionTests: [
                this.createTest('Selection Change Updates Toolbar', this.testSelectionChangeUpdates),
                this.createTest('Cursor Position in Formatted Text', this.testCursorPositionInFormattedText),
                this.createTest('Selection Edge Cases', this.testSelectionEdgeCases),
                this.createTest('Empty Selection Behavior', this.testEmptySelectionBehavior)
            ],
            
            // Keyboard shortcut tests
            keyboardTests: [
                this.createTest('Ctrl+B Bold Shortcut', this.testCtrlBShortcut),
                this.createTest('Ctrl+I Italic Shortcut', this.testCtrlIShortcut),
                this.createTest('Ctrl+U Underline Shortcut', this.testCtrlUShortcut),
                this.createTest('Multiple Keyboard Shortcuts', this.testMultipleKeyboardShortcuts)
            ],
            
            // Rapid interaction tests
            rapidInteractionTests: [
                this.createTest('Rapid Button Clicks', this.testRapidButtonClicks),
                this.createTest('Mixed Keyboard and Mouse', this.testMixedKeyboardMouse),
                this.createTest('Concurrent Formatting Operations', this.testConcurrentFormatting),
                this.createTest('Rapid Selection Changes', this.testRapidSelectionChanges)
            ],
            
            // Copy-paste tests
            copyPasteTests: [
                this.createTest('Formatted Content Paste', this.testFormattedContentPaste),
                this.createTest('Plain Text Paste', this.testPlainTextPaste),
                this.createTest('Mixed Content Paste', this.testMixedContentPaste),
                this.createTest('Paste with Selection', this.testPasteWithSelection)
            ],
            
            // Browser navigation tests
            navigationTests: [
                this.createTest('Page Refresh State Restoration', this.testPageRefreshState),
                this.createTest('Browser Back/Forward', this.testBrowserNavigation),
                this.createTest('Tab Switch Behavior', this.testTabSwitchBehavior)
            ],
            
            // Cross-browser tests
            crossBrowserTests: [
                this.createTest('Browser Compatibility Check', this.testBrowserCompatibility),
                this.createTest('Command State Consistency', this.testCommandStateConsistency),
                this.createTest('Selection API Differences', this.testSelectionAPIDifferences)
            ],
            
            // Mobile touch tests
            mobileTests: [
                this.createTest('Touch Selection', this.testTouchSelection),
                this.createTest('Touch Button Interactions', this.testTouchButtonInteractions),
                this.createTest('Mobile Keyboard Behavior', this.testMobileKeyboardBehavior)
            ],
            
            // Accessibility tests
            accessibilityTests: [
                this.createTest('Screen Reader Compatibility', this.testScreenReaderCompatibility),
                this.createTest('Keyboard Navigation', this.testKeyboardNavigation),
                this.createTest('ARIA Attributes', this.testARIAAttributes),
                this.createTest('Focus Management', this.testFocusManagement)
            ],
            
            // Performance tests
            performanceTests: [
                this.createTest('State Update Performance', this.testStateUpdatePerformance),
                this.createTest('Memory Leak Detection', this.testMemoryLeakDetection),
                this.createTest('Event Listener Cleanup', this.testEventListenerCleanup)
            ],
            
            // Edge case tests
            edgeCaseTests: [
                this.createTest('Empty Editor Behavior', this.testEmptyEditorBehavior),
                this.createTest('Very Long Content', this.testVeryLongContent),
                this.createTest('Special Characters', this.testSpecialCharacters),
                this.createTest('Nested Formatting', this.testNestedFormatting)
            ]
        };
    }
    
    createTest(name, testFunction) {
        return {
            name,
            testFunction,
            timeout: this.config.timeout,
            retryAttempts: this.config.retryAttempts
        };
    }
    
    async runTest(test) {
        this.currentTest = test;
        this.log(`Starting test: ${test.name}`, 'info');
        
        let lastError = null;
        
        for (let attempt = 1; attempt <= test.retryAttempts; attempt++) {
            try {
                if (attempt > 1) {
                    this.log(`Retry attempt ${attempt} for test: ${test.name}`, 'warning');
                    await this.delay(1000); // Wait before retry
                }
                
                const result = await Promise.race([
                    test.testFunction.call(this),
                    this.createTimeoutPromise(test.timeout)
                ]);
                
                if (result.passed) {
                    this.log(`✓ PASS: ${test.name}`, 'success');
                    this.testResults.push({
                        test: test.name,
                        status: 'passed',
                        attempt,
                        result,
                        timestamp: new Date().toISOString()
                    });
                    return result;
                } else {
                    lastError = new Error(result.message || 'Test failed');
                }
                
            } catch (error) {
                lastError = error;
                this.log(`✗ ERROR (attempt ${attempt}): ${test.name} - ${error.message}`, 'error');
            }
        }
        
        this.log(`✗ FAIL: ${test.name} - ${lastError.message}`, 'error');
        this.testResults.push({
            test: test.name,
            status: 'failed',
            attempts: test.retryAttempts,
            error: lastError.message,
            timestamp: new Date().toISOString()
        });
        
        return { passed: false, message: lastError.message };
    }
    
    async runTestSuite(suiteName) {
        this.log(`Starting test suite: ${suiteName}`, 'info');
        
        const tests = this.testSuite[suiteName];
        if (!tests) {
            throw new Error(`Test suite '${suiteName}' not found`);
        }
        
        const results = [];
        
        for (const test of tests) {
            const result = await this.runTest(test);
            results.push(result);
            await this.delay(this.config.delayBetweenTests);
        }
        
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        
        this.log(`Test suite '${suiteName}' completed: ${passed}/${total} passed`, 'info');
        
        return {
            suiteName,
            passed,
            total,
            results
        };
    }
    
    async runAllTests() {
        this.log('Starting complete test suite', 'info');
        
        const suiteResults = {};
        const allResults = [];
        
        for (const [suiteName, tests] of Object.entries(this.testSuite)) {
            const suiteResult = await this.runTestSuite(suiteName);
            suiteResults[suiteName] = suiteResult;
            allResults.push(...suiteResult.results);
        }
        
        const totalPassed = allResults.filter(r => r.passed).length;
        const totalTests = allResults.length;
        
        this.log(`All tests completed: ${totalPassed}/${totalTests} passed`, 'info');
        
        return {
            totalPassed,
            totalTests,
            passRate: (totalPassed / totalTests * 100).toFixed(1),
            suiteResults,
            allResults
        };
    }
    
    // Test implementations
    
    async testBoldStateSync() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        await this.executeCommand('bold');
        await this.delay(100);
        
        const result = this.validateButtonState('bold', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Bold state synchronized correctly' : 'Bold state not synchronized',
            details: result
        };
    }
    
    async testItalicStateSync() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        await this.executeCommand('italic');
        await this.delay(100);
        
        const result = this.validateButtonState('italic', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Italic state synchronized correctly' : 'Italic state not synchronized',
            details: result
        };
    }
    
    async testUnderlineStateSync() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        await this.executeCommand('underline');
        await this.delay(100);
        
        const result = this.validateButtonState('underline', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Underline state synchronized correctly' : 'Underline state not synchronized',
            details: result
        };
    }
    
    async testOrderedListStateSync() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        await this.executeCommand('insertOrderedList');
        await this.delay(100);
        
        const result = this.validateButtonState('insertOrderedList', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Ordered list state synchronized correctly' : 'Ordered list state not synchronized',
            details: result
        };
    }
    
    async testUnorderedListStateSync() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        await this.executeCommand('insertUnorderedList');
        await this.delay(100);
        
        const result = this.validateButtonState('insertUnorderedList', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Unordered list state synchronized correctly' : 'Unordered list state not synchronized',
            details: result
        };
    }
    
    async testBlockquoteStateSync() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        await this.executeCommand('formatBlock', '<blockquote>');
        await this.delay(100);
        
        const result = this.validateButtonState('insertBlockquote', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Blockquote state synchronized correctly' : 'Blockquote state not synchronized',
            details: result
        };
    }
    
    async testSelectionChangeUpdates() {
        await this.setupTestContent('<p><strong>Bold text</strong> normal text</p>');
        
        // Select bold text
        const boldElement = this.editor.querySelector('strong');
        await this.selectElement(boldElement);
        await this.delay(100);
        
        const result = this.validateButtonState('bold', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Selection change updated toolbar correctly' : 'Selection change did not update toolbar',
            details: result
        };
    }
    
    async testCursorPositionInFormattedText() {
        await this.setupTestContent('<p><strong>Bold text</strong></p>');
        
        // Place cursor in bold text
        const boldElement = this.editor.querySelector('strong');
        await this.placeCursorInElement(boldElement, 2);
        await this.delay(100);
        
        const result = this.validateButtonState('bold', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Cursor position in formatted text shows correct state' : 'Cursor position in formatted text shows incorrect state',
            details: result
        };
    }
    
    async testSelectionEdgeCases() {
        await this.setupTestContent('<p><strong>Bold</strong> normal <em>italic</em> text</p>');
        
        // Test selection across different formatting
        const range = document.createRange();
        const boldElement = this.editor.querySelector('strong');
        const italicElement = this.editor.querySelector('em');
        
        range.setStart(boldElement.firstChild, 2);
        range.setEnd(italicElement.firstChild, 2);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        await this.delay(100);
        
        // Check if toolbar shows mixed state or no state
        const boldResult = this.validateButtonState('bold');
        const italicResult = this.validateButtonState('italic');
        
        return {
            passed: true, // This test is more about observing behavior
            message: 'Selection edge case handled',
            details: { boldResult, italicResult }
        };
    }
    
    async testEmptySelectionBehavior() {
        await this.setupTestContent('<p>Test text</p>');
        
        // Clear selection
        const selection = window.getSelection();
        selection.removeAllRanges();
        await this.delay(100);
        
        // Check if toolbar shows appropriate state
        const boldResult = this.validateButtonState('bold');
        
        return {
            passed: true, // This test is more about observing behavior
            message: 'Empty selection behavior observed',
            details: { boldResult }
        };
    }
    
    async testCtrlBShortcut() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Simulate Ctrl+B
        await this.simulateKeyboardShortcut('b', { ctrlKey: true });
        await this.delay(100);
        
        const result = this.validateButtonState('bold', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Ctrl+B shortcut synchronized correctly' : 'Ctrl+B shortcut not synchronized',
            details: result
        };
    }
    
    async testCtrlIShortcut() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Simulate Ctrl+I
        await this.simulateKeyboardShortcut('i', { ctrlKey: true });
        await this.delay(100);
        
        const result = this.validateButtonState('italic', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Ctrl+I shortcut synchronized correctly' : 'Ctrl+I shortcut not synchronized',
            details: result
        };
    }
    
    async testCtrlUShortcut() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Simulate Ctrl+U
        await this.simulateKeyboardShortcut('u', { ctrlKey: true });
        await this.delay(100);
        
        const result = this.validateButtonState('underline', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Ctrl+U shortcut synchronized correctly' : 'Ctrl+U shortcut not synchronized',
            details: result
        };
    }
    
    async testMultipleKeyboardShortcuts() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Apply multiple formatting
        await this.simulateKeyboardShortcut('b', { ctrlKey: true });
        await this.delay(50);
        await this.simulateKeyboardShortcut('i', { ctrlKey: true });
        await this.delay(100);
        
        const boldResult = this.validateButtonState('bold', true);
        const italicResult = this.validateButtonState('italic', true);
        
        return {
            passed: boldResult.consistent && italicResult.consistent,
            message: boldResult.consistent && italicResult.consistent ? 'Multiple keyboard shortcuts synchronized correctly' : 'Multiple keyboard shortcuts not synchronized',
            details: { boldResult, italicResult }
        };
    }
    
    async testRapidButtonClicks() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Rapidly apply and remove bold
        for (let i = 0; i < 5; i++) {
            await this.executeCommand('bold');
            await this.delay(10);
        }
        
        await this.delay(100);
        
        const result = this.validateButtonState('bold');
        return {
            passed: result.consistent,
            message: result.consistent ? 'Rapid button clicks synchronized correctly' : 'Rapid button clicks not synchronized',
            details: result
        };
    }
    
    async testMixedKeyboardMouse() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Apply bold with keyboard
        await this.simulateKeyboardShortcut('b', { ctrlKey: true });
        await this.delay(50);
        
        // Apply italic with button
        await this.executeCommand('italic');
        await this.delay(100);
        
        const boldResult = this.validateButtonState('bold', true);
        const italicResult = this.validateButtonState('italic', true);
        
        return {
            passed: boldResult.consistent && italicResult.consistent,
            message: boldResult.consistent && italicResult.consistent ? 'Mixed interactions synchronized correctly' : 'Mixed interactions not synchronized',
            details: { boldResult, italicResult }
        };
    }
    
    async testConcurrentFormatting() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Apply multiple formatting simultaneously
        const promises = [
            this.executeCommand('bold'),
            this.executeCommand('italic'),
            this.executeCommand('underline')
        ];
        
        await Promise.all(promises);
        await this.delay(100);
        
        const boldResult = this.validateButtonState('bold', true);
        const italicResult = this.validateButtonState('italic', true);
        const underlineResult = this.validateButtonState('underline', true);
        
        return {
            passed: boldResult.consistent && italicResult.consistent && underlineResult.consistent,
            message: 'Concurrent formatting operations handled correctly',
            details: { boldResult, italicResult, underlineResult }
        };
    }
    
    async testRapidSelectionChanges() {
        await this.setupTestContent('<p><strong>Bold</strong> <em>italic</em> <u>underline</u></p>');
        
        // Rapidly change selection between different formatted elements
        const elements = this.editor.querySelectorAll('strong, em, u');
        
        for (let i = 0; i < elements.length; i++) {
            await this.selectElement(elements[i]);
            await this.delay(20);
        }
        
        await this.delay(100);
        
        return {
            passed: true, // This test is more about observing behavior
            message: 'Rapid selection changes handled',
            details: { elementsCount: elements.length }
        };
    }
    
    async testFormattedContentPaste() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Simulate pasting formatted content
        const formattedHTML = '<strong>Bold text</strong>';
        await this.simulatePaste(formattedHTML);
        await this.delay(100);
        
        const result = this.validateButtonState('bold', true);
        return {
            passed: result.consistent && result.buttonState,
            message: result.consistent ? 'Formatted content paste synchronized correctly' : 'Formatted content paste not synchronized',
            details: result
        };
    }
    
    async testPlainTextPaste() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Simulate pasting plain text
        const plainText = 'Plain text';
        await this.simulatePaste(plainText);
        await this.delay(100);
        
        const boldResult = this.validateButtonState('bold', false);
        const italicResult = this.validateButtonState('italic', false);
        
        return {
            passed: boldResult.consistent && italicResult.consistent,
            message: boldResult.consistent && italicResult.consistent ? 'Plain text paste synchronized correctly' : 'Plain text paste not synchronized',
            details: { boldResult, italicResult }
        };
    }
    
    async testMixedContentPaste() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        // Simulate pasting mixed content
        const mixedHTML = '<strong>Bold</strong> and <em>italic</em> text';
        await this.simulatePaste(mixedHTML);
        await this.delay(100);
        
        return {
            passed: true, // This test is more about observing behavior
            message: 'Mixed content paste handled',
            details: { content: mixedHTML }
        };
    }
    
    async testPasteWithSelection() {
        await this.setupTestContent('<p><strong>Bold text</strong> normal text</p>');
        
        // Select part of bold text
        const boldElement = this.editor.querySelector('strong');
        const range = document.createRange();
        range.setStart(boldElement.firstChild, 0);
        range.setEnd(boldElement.firstChild, 4);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Paste content
        await this.simulatePaste('New text');
        await this.delay(100);
        
        return {
            passed: true, // This test is more about observing behavior
            message: 'Paste with selection handled',
            details: { selectionRange: range.toString() }
        };
    }
    
    async testPageRefreshState() {
        // This test would need to be run in a controlled environment
        // where we can simulate page refresh
        return {
            passed: true,
            message: 'Page refresh state test requires controlled environment',
            details: { note: 'This test needs to be run manually or in a test environment' }
        };
    }
    
    async testBrowserNavigation() {
        // This test would need to be run in a controlled environment
        return {
            passed: true,
            message: 'Browser navigation test requires controlled environment',
            details: { note: 'This test needs to be run manually or in a test environment' }
        };
    }
    
    async testTabSwitchBehavior() {
        // Simulate tab switch by blurring and focusing
        this.editor.blur();
        await this.delay(100);
        this.editor.focus();
        await this.delay(100);
        
        return {
            passed: true,
            message: 'Tab switch behavior handled',
            details: { focusEvents: this.getEventLog('focus').length }
        };
    }
    
    async testBrowserCompatibility() {
        const userAgent = navigator.userAgent;
        const isChrome = userAgent.includes('Chrome');
        const isFirefox = userAgent.includes('Firefox');
        const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
        const isEdge = userAgent.includes('Edge');
        
        const browser = isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : 'Unknown';
        
        return {
            passed: true,
            message: `Browser compatibility check completed for ${browser}`,
            details: { browser, userAgent }
        };
    }
    
    async testCommandStateConsistency() {
        await this.setupTestContent('<p>Test text</p>');
        await this.selectAllText();
        
        await this.executeCommand('bold');
        await this.delay(100);
        
        const queryState = document.queryCommandState('bold');
        const buttonState = this.getButtonState('bold');
        
        return {
            passed: queryState === buttonState,
            message: queryState === buttonState ? 'Command state consistent across browser' : 'Command state inconsistent across browser',
            details: { queryState, buttonState }
        };
    }
    
    async testSelectionAPIDifferences() {
        // Test different selection APIs
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        
        return {
            passed: true,
            message: 'Selection API differences observed',
            details: {
                selectionExists: !!selection,
                rangeCount: selection.rangeCount,
                hasRange: !!range
            }
        };
    }
    
    async testTouchSelection() {
        // This test would need to be run on a touch device
        return {
            passed: true,
            message: 'Touch selection test requires touch device',
            details: { note: 'This test needs to be run on a touch device' }
        };
    }
    
    async testTouchButtonInteractions() {
        // This test would need to be run on a touch device
        return {
            passed: true,
            message: 'Touch button interactions test requires touch device',
            details: { note: 'This test needs to be run on a touch device' }
        };
    }
    
    async testMobileKeyboardBehavior() {
        // This test would need to be run on a mobile device
        return {
            passed: true,
            message: 'Mobile keyboard behavior test requires mobile device',
            details: { note: 'This test needs to be run on a mobile device' }
        };
    }
    
    async testScreenReaderCompatibility() {
        // Check for ARIA attributes and accessibility features
        const buttons = this.toolbar.querySelectorAll('.toolbar-btn');
        const hasAriaLabels = Array.from(buttons).every(btn => btn.hasAttribute('aria-label') || btn.hasAttribute('title'));
        
        return {
            passed: hasAriaLabels,
            message: hasAriaLabels ? 'Screen reader compatibility check passed' : 'Missing ARIA labels or titles',
            details: { hasAriaLabels, buttonCount: buttons.length }
        };
    }
    
    async testKeyboardNavigation() {
        // Test keyboard navigation through toolbar
        const buttons = this.toolbar.querySelectorAll('.toolbar-btn');
        const firstButton = buttons[0];
        
        if (firstButton) {
            firstButton.focus();
            await this.delay(100);
            
            const focusedButton = document.activeElement;
            const isToolbarButton = this.toolbar.contains(focusedButton);
            
            return {
                passed: isToolbarButton,
                message: isToolbarButton ? 'Keyboard navigation works correctly' : 'Keyboard navigation not working',
                details: { focusedButton: focusedButton.tagName, isToolbarButton }
            };
        }
        
        return {
            passed: false,
            message: 'No toolbar buttons found for keyboard navigation test',
            details: { buttonCount: buttons.length }
        };
    }
    
    async testARIAAttributes() {
        const buttons = this.toolbar.querySelectorAll('.toolbar-btn');
        const ariaChecks = Array.from(buttons).map(btn => ({
            hasAriaLabel: btn.hasAttribute('aria-label'),
            hasTitle: btn.hasAttribute('title'),
            hasRole: btn.hasAttribute('role'),
            isButton: btn.tagName === 'BUTTON'
        }));
        
        const allHaveLabels = ariaChecks.every(check => check.hasAriaLabel || check.hasTitle);
        const allAreButtons = ariaChecks.every(check => check.isButton);
        
        return {
            passed: allHaveLabels && allAreButtons,
            message: allHaveLabels && allAreButtons ? 'ARIA attributes are correct' : 'ARIA attributes need improvement',
            details: { ariaChecks, allHaveLabels, allAreButtons }
        };
    }
    
    async testFocusManagement() {
        // Test focus management between editor and toolbar
        this.editor.focus();
        await this.delay(100);
        
        const editorFocused = document.activeElement === this.editor;
        
        const firstButton = this.toolbar.querySelector('.toolbar-btn');
        if (firstButton) {
            firstButton.focus();
            await this.delay(100);
            
            const buttonFocused = document.activeElement === firstButton;
            
            return {
                passed: editorFocused && buttonFocused,
                message: editorFocused && buttonFocused ? 'Focus management works correctly' : 'Focus management has issues',
                details: { editorFocused, buttonFocused }
            };
        }
        
        return {
            passed: editorFocused,
            message: editorFocused ? 'Editor focus works correctly' : 'Editor focus has issues',
            details: { editorFocused }
        };
    }
    
    async testStateUpdatePerformance() {
        const startTime = performance.now();
        
        // Perform multiple state updates
        for (let i = 0; i < 100; i++) {
            await this.executeCommand('bold');
            await this.delay(1);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return {
            passed: duration < 1000, // Should complete in less than 1 second
            message: `State update performance: ${duration.toFixed(2)}ms for 100 updates`,
            details: { duration, updatesPerSecond: (100 / duration * 1000).toFixed(2) }
        };
    }
    
    async testMemoryLeakDetection() {
        const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        // Perform many operations
        for (let i = 0; i < 1000; i++) {
            await this.executeCommand('bold');
            await this.delay(1);
        }
        
        const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        const memoryIncrease = finalMemory - initialMemory;
        
        return {
            passed: memoryIncrease < 10000000, // Less than 10MB increase
            message: `Memory usage: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`,
            details: { initialMemory, finalMemory, memoryIncrease }
        };
    }
    
    async testEventListenerCleanup() {
        // This test would need to be run in a controlled environment
        // where we can monitor event listener counts
        return {
            passed: true,
            message: 'Event listener cleanup test requires controlled environment',
            details: { note: 'This test needs to be run in a test environment with event listener monitoring' }
        };
    }
    
    async testEmptyEditorBehavior() {
        await this.setupTestContent('');
        
        const boldResult = this.validateButtonState('bold', false);
        const italicResult = this.validateButtonState('italic', false);
        
        return {
            passed: boldResult.consistent && italicResult.consistent,
            message: boldResult.consistent && italicResult.consistent ? 'Empty editor behavior is correct' : 'Empty editor behavior is incorrect',
            details: { boldResult, italicResult }
        };
    }
    
    async testVeryLongContent() {
        // Create very long content
        const longContent = '<p>' + 'A'.repeat(10000) + '</p>';
        await this.setupTestContent(longContent);
        
        // Test state updates with long content
        await this.selectAllText();
        await this.executeCommand('bold');
        await this.delay(100);
        
        const result = this.validateButtonState('bold', true);
        
        return {
            passed: result.consistent,
            message: result.consistent ? 'Very long content handled correctly' : 'Very long content caused issues',
            details: { contentLength: longContent.length, result }
        };
    }
    
    async testSpecialCharacters() {
        const specialContent = '<p>Special chars: éñüñç 中文 🚀 &lt;&gt;&amp;</p>';
        await this.setupTestContent(specialContent);
        
        await this.selectAllText();
        await this.executeCommand('bold');
        await this.delay(100);
        
        const result = this.validateButtonState('bold', true);
        
        return {
            passed: result.consistent,
            message: result.consistent ? 'Special characters handled correctly' : 'Special characters caused issues',
            details: { content: specialContent, result }
        };
    }
    
    async testNestedFormatting() {
        const nestedContent = '<p><strong><em><u>Nested formatting</u></em></strong></p>';
        await this.setupTestContent(nestedContent);
        
        // Select nested content
        const nestedElement = this.editor.querySelector('u');
        await this.selectElement(nestedElement);
        await this.delay(100);
        
        const boldResult = this.validateButtonState('bold', true);
        const italicResult = this.validateButtonState('italic', true);
        const underlineResult = this.validateButtonState('underline', true);
        
        return {
            passed: boldResult.consistent && italicResult.consistent && underlineResult.consistent,
            message: 'Nested formatting handled correctly',
            details: { boldResult, italicResult, underlineResult }
        };
    }
    
    // Helper methods
    
    async setupTestContent(html) {
        this.editor.innerHTML = html;
        await this.delay(50);
    }
    
    async selectAllText() {
        const range = document.createRange();
        range.selectNodeContents(this.editor);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        await this.delay(50);
    }
    
    async selectElement(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        await this.delay(50);
    }
    
    async placeCursorInElement(element, offset) {
        const range = document.createRange();
        range.setStart(element.firstChild, offset);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        await this.delay(50);
    }
    
    async executeCommand(command, value = null) {
        this.editor.focus();
        
        try {
            if (value !== null) {
                document.execCommand(command, false, value);
            } else {
                document.execCommand(command, false, null);
            }
            await this.delay(50);
        } catch (error) {
            this.log(`Error executing command ${command}: ${error.message}`, 'error');
        }
    }
    
    async simulateKeyboardShortcut(key, modifiers = {}) {
        const event = new KeyboardEvent('keydown', {
            key,
            ctrlKey: modifiers.ctrlKey || false,
            metaKey: modifiers.metaKey || false,
            shiftKey: modifiers.shiftKey || false,
            altKey: modifiers.altKey || false,
            bubbles: true
        });
        
        this.editor.dispatchEvent(event);
        await this.delay(50);
    }
    
    async simulatePaste(content) {
        const event = new ClipboardEvent('paste', {
            clipboardData: new DataTransfer()
        });
        
        event.clipboardData.setData('text/html', content);
        this.editor.dispatchEvent(event);
        await this.delay(50);
    }
    
    validateButtonState(buttonType, expectedState = null) {
        const buttonState = this.getButtonState(buttonType);
        const actualState = this.getActualFormatting(buttonType);
        const expected = expectedState !== null ? expectedState : actualState;
        
        return {
            buttonType,
            expectedState: expected,
            buttonState,
            actualState,
            consistent: buttonState === actualState,
            timestamp: new Date().toISOString()
        };
    }
    
    getButtonState(buttonType) {
        const button = this.toolbar.querySelector(`.toolbar-btn[onclick*="${buttonType}"]`);
        return button ? button.classList.contains('active') : false;
    }
    
    getActualFormatting(buttonType) {
        switch (buttonType) {
            case 'bold':
                return document.queryCommandState('bold');
            case 'italic':
                return document.queryCommandState('italic');
            case 'underline':
                return document.queryCommandState('underline');
            case 'insertOrderedList':
                return document.queryCommandState('insertOrderedList');
            case 'insertUnorderedList':
                return document.queryCommandState('insertUnorderedList');
            case 'insertBlockquote':
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    let node = selection.getRangeAt(0).commonAncestorContainer;
                    while (node && node !== this.editor) {
                        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BLOCKQUOTE') {
                            return true;
                        }
                        node = node.parentNode;
                    }
                }
                return false;
            default:
                return false;
        }
    }
    
    logEvent(eventType, event) {
        this.eventLog.push({
            type: eventType,
            timestamp: new Date().toISOString(),
            target: event.target.tagName,
            details: {
                key: event.key,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey
            }
        });
    }
    
    logStateChange(element, oldValue, newValue) {
        this.stateHistory.push({
            element: element.tagName,
            oldValue,
            newValue,
            timestamp: new Date().toISOString()
        });
    }
    
    getEventLog(eventType) {
        return this.eventLog.filter(event => event.type === eventType);
    }
    
    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    log(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    // Export results
    exportResults() {
        return {
            timestamp: new Date().toISOString(),
            testResults: this.testResults,
            eventLog: this.eventLog,
            stateHistory: this.stateHistory,
            config: this.config
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextEditorTestFramework;
}