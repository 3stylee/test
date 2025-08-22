// Universal Survey Bot - Injectable Content Script
// This file gets injected into any webpage to provide survey bot functionality

(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.surveyBotInjected) {
    console.log('🤖 Survey Bot already injected');
    return;
  }
  window.surveyBotInjected = true;

  // OpenAI API integration
  class OpenAIService {
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.baseURL = 'https://api.openai.com/v1/chat/completions';
    }

    async generateResponse(question, type, options = []) {
      try {
        let prompt = `You are answering a survey for testing purposes.
Answer concisely and naturally. Be brief but authentic.

Persona: A retired homeowner with children, age 54. 
If asked about working in specific industries, always answer "No". 
Sound like an appealing survey participant but keep answers realistic.

Question: ${question}
Type: ${type}`;

        if (options && options.length > 0) {
          prompt += `\nOptions: ${options.join(', ')}`;
          prompt += `\nRespond with only the option text, nothing else.`;
        }

        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are simulating survey responses for testing a survey app." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 50
          })
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message?.content?.trim() || "";
      } catch (error) {
        console.error("Error generating response:", error);
        return this.getFallbackResponse(type, options);
      }
    }

    getFallbackResponse(type, options) {
      switch (type) {
        case 'multiple-choice':
          return options && options.length > 0 ? 
            options[Math.floor(Math.random() * options.length)] : 
            'Yes';
        case 'rating':
          return (Math.floor(Math.random() * 5) + 1).toString();
        case 'text':
          return 'Yes';
        case 'textarea':
          return 'Good experience overall.';
        default:
          return 'Yes';
      }
    }
  }

  // Main Survey Bot Class
  class UniversalSurveyBot {
    constructor() {
      this.openaiService = null;
      this.settings = {
        useRandomDelays: true,
        simulateMouseMovement: true,
        simulateTyping: true,
        useAnswerVariability: true,
        conciseResponses: true
      };
      this.isRunning = false;
      this.currentMouseX = 0;
      this.currentMouseY = 0;
      this.floatingButton = null;
      this.controlPanel = null;

      this.initializeMouseTracking();
      this.createFloatingInterface();
      console.log('🤖 Universal Survey Bot initialized');
    }

    initializeMouseTracking() {
      document.addEventListener('mousemove', (e) => {
        this.currentMouseX = e.clientX;
        this.currentMouseY = e.clientY;
      });
    }

    createFloatingInterface() {
      // Create floating button
      this.floatingButton = document.createElement('div');
      this.floatingButton.innerHTML = `
        <div id="survey-bot-button" style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      `;

      // Create control panel
      this.controlPanel = document.createElement('div');
      this.controlPanel.innerHTML = `
        <div id="survey-bot-panel" style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 320px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: none;
          overflow: hidden;
        ">
          <div style="padding: 20px; border-bottom: 1px solid #eee;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
              <h3 style="margin: 0; color: #333; font-size: 18px; font-weight: 600;">🤖 Survey Bot</h3>
              <button id="close-panel" style="
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #666;
              ">×</button>
            </div>
            
            <div style="margin-bottom: 15px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div id="status-indicator" style="
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  background: #ccc;
                "></div>
                <span id="status-text" style="font-size: 14px; color: #666;">Ready</span>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="display: block; font-size: 14px; font-weight: 500; color: #333; margin-bottom: 5px;">
                OpenAI API Key
              </label>
              <input 
                id="api-key-input" 
                type="password" 
                placeholder="sk-..."
                style="
                  width: 100%;
                  padding: 8px 12px;
                  border: 1px solid #ddd;
                  border-radius: 6px;
                  font-size: 14px;
                  box-sizing: border-box;
                "
              />
            </div>

            <div style="margin-bottom: 15px;">
              <button id="settings-toggle" style="
                background: none;
                border: none;
                color: #667eea;
                font-size: 14px;
                cursor: pointer;
                text-decoration: underline;
              ">Show Settings</button>
            </div>

            <div id="settings-panel" style="display: none; margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
              <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                  <input type="checkbox" id="setting-delays" checked> Random delays
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                  <input type="checkbox" id="setting-mouse" checked> Mouse movement
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                  <input type="checkbox" id="setting-typing" checked> Realistic typing
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                  <input type="checkbox" id="setting-variability" checked> Answer variability
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                  <input type="checkbox" id="setting-concise" checked> Concise responses
                </label>
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <button id="start-bot" style="
                flex: 1;
                padding: 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
              ">Start Bot</button>
              <button id="stop-bot" style="
                flex: 1;
                padding: 10px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                display: none;
              ">Stop Bot</button>
            </div>
          </div>

          <div style="padding: 15px; background: #f8f9fa; font-size: 12px; color: #666;">
            <strong>Instructions:</strong> Enter your OpenAI API key and click "Start Bot" to automatically fill out this survey with AI-generated responses.
          </div>
        </div>
      `;

      // Add to page
      document.body.appendChild(this.floatingButton);
      document.body.appendChild(this.controlPanel);

      // Add event listeners
      this.setupEventListeners();
      
      // Load saved settings
      this.loadSettings();
    }

    setupEventListeners() {
      const button = document.getElementById('survey-bot-button');
      const panel = document.getElementById('survey-bot-panel');
      const closeBtn = document.getElementById('close-panel');
      const startBtn = document.getElementById('start-bot');
      const stopBtn = document.getElementById('stop-bot');
      const settingsToggle = document.getElementById('settings-toggle');
      const settingsPanel = document.getElementById('settings-panel');

      button?.addEventListener('click', () => {
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
          button.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        }
      });

      closeBtn?.addEventListener('click', () => {
        if (panel && button) {
          panel.style.display = 'none';
          button.style.display = 'flex';
        }
      });

      startBtn?.addEventListener('click', () => this.startBot());
      stopBtn?.addEventListener('click', () => this.stopBot());

      settingsToggle?.addEventListener('click', () => {
        if (settingsPanel && settingsToggle) {
          const isVisible = settingsPanel.style.display !== 'none';
          settingsPanel.style.display = isVisible ? 'none' : 'block';
          settingsToggle.textContent = isVisible ? 'Show Settings' : 'Hide Settings';
        }
      });

      // Settings checkboxes
      const settingIds = ['delays', 'mouse', 'typing', 'variability', 'concise'];
      const settingKeys = ['useRandomDelays', 'simulateMouseMovement', 'simulateTyping', 'useAnswerVariability', 'conciseResponses'];
      
      settingIds.forEach((id, index) => {
        const checkbox = document.getElementById(`setting-${id}`);
        checkbox?.addEventListener('change', () => {
          this.settings[settingKeys[index]] = checkbox.checked;
          this.saveSettings();
        });
      });
    }

    loadSettings() {
      try {
        const savedApiKey = localStorage.getItem('surveyBotApiKey');
        const savedSettings = localStorage.getItem('surveyBotSettings');
        
        if (savedApiKey) {
          const apiKeyInput = document.getElementById('api-key-input');
          if (apiKeyInput) apiKeyInput.value = savedApiKey;
        }
        
        if (savedSettings) {
          this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
          this.updateSettingsUI();
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    saveSettings() {
      try {
        localStorage.setItem('surveyBotSettings', JSON.stringify(this.settings));
        
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput?.value) {
          localStorage.setItem('surveyBotApiKey', apiKeyInput.value);
        }
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }

    updateSettingsUI() {
      const settingIds = ['delays', 'mouse', 'typing', 'variability', 'concise'];
      const settingKeys = ['useRandomDelays', 'simulateMouseMovement', 'simulateTyping', 'useAnswerVariability', 'conciseResponses'];
      
      settingIds.forEach((id, index) => {
        const checkbox = document.getElementById(`setting-${id}`);
        if (checkbox) {
          checkbox.checked = this.settings[settingKeys[index]];
        }
      });
    }

    updateStatus(status, isRunning = false) {
      const statusText = document.getElementById('status-text');
      const statusIndicator = document.getElementById('status-indicator');
      const startBtn = document.getElementById('start-bot');
      const stopBtn = document.getElementById('stop-bot');

      if (statusText) statusText.textContent = status;
      if (statusIndicator) {
        statusIndicator.style.background = isRunning ? '#28a745' : '#6c757d';
        if (isRunning) {
          statusIndicator.style.animation = 'pulse 2s infinite';
        } else {
          statusIndicator.style.animation = 'none';
        }
      }
      if (startBtn) startBtn.style.display = isRunning ? 'none' : 'block';
      if (stopBtn) stopBtn.style.display = isRunning ? 'block' : 'none';
    }

    async startBot() {
      const apiKeyInput = document.getElementById('api-key-input');
      const apiKey = apiKeyInput?.value?.trim();

      if (!apiKey) {
        alert('Please enter your OpenAI API key');
        return;
      }

      this.saveSettings();
      this.openaiService = new OpenAIService(apiKey);

      this.isRunning = true;
      this.updateStatus('Starting bot...', true);

      try {
        await this.simulateInitialBehavior();
        await this.fillSurvey();
        this.updateStatus('Survey completed!', false);
      } catch (error) {
        console.error('Bot error:', error);
        this.updateStatus(`Error: ${error.message}`, false);
      } finally {
        this.isRunning = false;
      }
    }

    stopBot() {
      this.isRunning = false;
      this.updateStatus('Stopped', false);
    }

    async simulateInitialBehavior() {
      this.updateStatus('Reading page...', true);
      await this.humanDelay(2000, 4000);
      
      this.updateStatus('Scrolling...', true);
      await this.simulatePageScroll();
      
      await this.simulateIdleMouseMovement();
    }

    async simulatePageScroll() {
      const scrollSteps = Math.floor(Math.random() * 3) + 2;
      const maxScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);
      
      for (let i = 0; i < scrollSteps; i++) {
        const scrollY = (i + 1) * (maxScroll / scrollSteps) + (Math.random() - 0.5) * 200;
        const clampedScrollY = Math.max(0, Math.min(maxScroll, scrollY));
        
        window.scrollTo({
          top: clampedScrollY,
          behavior: 'smooth'
        });
        
        await this.humanDelay(800, 1500);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await this.humanDelay(500, 1000);
    }

    async simulateIdleMouseMovement() {
      const movements = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < movements; i++) {
        const targetX = Math.random() * window.innerWidth;
        const targetY = Math.random() * window.innerHeight;
        
        await this.simulateNaturalMouseMovement(targetX, targetY);
        await this.humanDelay(500, 1200);
      }
    }

    async fillSurvey() {
      this.updateStatus('Filling survey...', true);
      
      const formElements = this.findFormElements();
      const processedElements = new Set();
      
      console.log(`🤖 Found ${formElements.length} form elements`);
      
      for (const element of formElements) {
        if (!this.isRunning) break;
        
        if (processedElements.has(element) || this.isSubmitButton(element)) {
          continue;
        }
        
        if (!this.isElementVisible(element)) {
          continue;
        }
        
        await this.focusOnElement(element);
        await this.processFormElement(element);
        processedElements.add(element);
        
        await this.humanDelay(800, 2500);
      }
      
      this.updateStatus('Submitting...', true);
      await this.handleSubmission();
    }

    findFormElements() {
      const selectors = [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="tel"]',
        'input[type="url"]',
        'input[type="number"]',
        'input[type="radio"]',
        'input[type="checkbox"]',
        'input[type="range"]',
        'select',
        'textarea'
      ];
      
      const elements = [];
      selectors.forEach(selector => {
        elements.push(...Array.from(document.querySelectorAll(selector)));
      });
      
      return elements;
    }

    isSubmitButton(element) {
      if (element.tagName.toLowerCase() === 'button') {
        const text = element.textContent?.toLowerCase() || '';
        return text.includes('submit') || text.includes('send') || text.includes('complete');
      }
      
      if (element.tagName.toLowerCase() === 'input') {
        const type = element.type;
        return type === 'submit';
      }
      
      return false;
    }

    isElementVisible(element) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      return rect.width > 0 && 
             rect.height > 0 && 
             style.visibility !== 'hidden' && 
             style.display !== 'none' &&
             rect.top < window.innerHeight &&
             rect.bottom > 0;
    }

    async focusOnElement(element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      await this.humanDelay(300, 700);
      
      const rect = element.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2 + (Math.random() - 0.5) * 30;
      const targetY = rect.top + rect.height / 2 + (Math.random() - 0.5) * 20;
      
      await this.simulateNaturalMouseMovement(targetX, targetY);
      await this.humanDelay(200, 500);
    }

    async processFormElement(element) {
      const tagName = element.tagName.toLowerCase();
      const type = element.type || '';
      
      const questionText = this.extractQuestionText(element);
      
      switch (tagName) {
        case 'input':
          await this.handleInput(element, type, questionText);
          break;
        case 'select':
          await this.handleSelect(element, questionText);
          break;
        case 'textarea':
          await this.handleTextarea(element, questionText);
          break;
      }
    }

    extractQuestionText(element) {
      const id = element.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent?.trim() || '';
      }
      
      const parentLabel = element.closest('label');
      if (parentLabel) {
        return parentLabel.textContent?.trim() || '';
      }
      
      let parent = element.parentElement;
      let attempts = 0;
      
      while (parent && attempts < 5) {
        const text = parent.textContent?.trim() || '';
        if (text.length > 10 && (text.includes('?') || text.includes(':'))) {
          const sentences = text.split(/[.!?]/);
          const questionSentence = sentences.find(s => s.includes('?')) || sentences[0];
          return questionSentence?.trim() || text.substring(0, 100);
        }
        parent = parent.parentElement;
        attempts++;
      }
      
      return element.placeholder || 
             element.getAttribute('name') || 
             'Survey question';
    }

    async handleInput(element, type, questionText) {
      switch (type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'url':
        case 'number':
          const response = await this.openaiService.generateResponse(questionText, 'text');
          await this.simulateTyping(element, response);
          break;
          
        case 'radio':
          await this.handleRadioButton(element, questionText);
          break;
          
        case 'checkbox':
          if (Math.random() > 0.4) {
            await this.simulateClick(element);
          }
          break;
          
        case 'range':
          const rating = await this.openaiService.generateResponse(questionText, 'rating');
          const value = this.parseRatingResponse(rating);
          await this.simulateRangeInput(element, value);
          break;
      }
    }

    async handleRadioButton(element, questionText) {
      const name = element.name;
      if (!name) return;
      
      const radioGroup = Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`));
      const options = radioGroup.map(radio => {
        const label = document.querySelector(`label[for="${radio.id}"]`) || 
                     radio.closest('label') ||
                     radio.parentElement;
        return {
          element: radio,
          label: label?.textContent?.trim() || radio.value || 'Option'
        };
      });
      
      if (options.length > 0) {
        const response = await this.openaiService.generateResponse(
          questionText, 
          'multiple-choice', 
          options.map(opt => opt.label)
        );
        
        const bestMatch = this.findBestMatch(response, options);
        if (bestMatch && Math.random() > 0.1) {
          await this.simulateClick(bestMatch.element);
        }
      }
    }

    async handleSelect(element, questionText) {
      const options = Array.from(element.options).slice(1);
      
      if (options.length > 0) {
        const optionTexts = options.map(opt => opt.textContent?.trim() || opt.value);
        const response = await this.openaiService.generateResponse(questionText, 'multiple-choice', optionTexts);
        
        const bestMatch = this.findBestMatch(response, options.map(opt => ({
          element: opt,
          label: opt.textContent?.trim() || opt.value
        })));
        
        if (bestMatch) {
          element.value = bestMatch.element.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          const randomOption = options[Math.floor(Math.random() * options.length)];
          element.value = randomOption.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        await this.humanDelay(200, 500);
      }
    }

    async handleTextarea(element, questionText) {
      const response = await this.openaiService.generateResponse(questionText, 'textarea');
      await this.simulateTyping(element, response);
    }

    findBestMatch(response, options) {
      const responseLower = response.toLowerCase();
      
      let bestMatch = options.find(opt => 
        opt.label.toLowerCase() === responseLower
      );
      
      if (!bestMatch) {
        bestMatch = options.find(opt => 
          opt.label.toLowerCase().includes(responseLower) ||
          responseLower.includes(opt.label.toLowerCase())
        );
      }
      
      if (!bestMatch && options.length > 0) {
        bestMatch = options[Math.floor(Math.random() * options.length)];
      }
      
      return bestMatch;
    }

    async simulateClick(element) {
      const rect = element.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2 + (Math.random() - 0.5) * 10;
      const targetY = rect.top + rect.height / 2 + (Math.random() - 0.5) * 10;
      
      await this.simulateNaturalMouseMovement(targetX, targetY);
      await this.humanDelay(100, 300);
      
      const events = ['mousedown', 'mouseup', 'click'];
      for (const eventType of events) {
        const event = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          clientX: targetX,
          clientY: targetY
        });
        element.dispatchEvent(event);
        if (eventType !== 'click') await this.humanDelay(50, 150);
      }
    }

    async simulateTyping(element, text) {
      await this.simulateClick(element);
      
      element.focus();
      element.select();
      await this.humanDelay(100, 200);
      
      for (let i = 0; i < text.length; i++) {
        if (!this.isRunning) break;
        
        const char = text[i];
        
        if (Math.random() < 0.03 && i > 0) {
          const wrongChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
          await this.typeCharacter(element, wrongChar);
          await this.humanDelay(200, 800);
          await this.simulateBackspace(element);
        }
        
        if (char === ' ' && Math.random() < 0.1) {
          await this.humanDelay(300, 1000);
        }
        
        await this.typeCharacter(element, char);
        
        const baseDelay = this.settings.simulateTyping ? 
          Math.random() * 120 + 40 : 
          Math.random() * 30 + 10;
        
        await this.humanDelay(baseDelay * 0.8, baseDelay * 1.2);
      }
      
      await this.humanDelay(200, 500);
    }

    async typeCharacter(element, char) {
      const events = [
        new KeyboardEvent('keydown', { key: char, bubbles: true, cancelable: true }),
        new KeyboardEvent('keypress', { key: char, bubbles: true, cancelable: true }),
        new InputEvent('input', { data: char, bubbles: true, cancelable: true }),
        new KeyboardEvent('keyup', { key: char, bubbles: true, cancelable: true })
      ];
      
      events[0] && element.dispatchEvent(events[0]);
      events[1] && element.dispatchEvent(events[1]);
      
      const cursorPos = element.selectionStart || 0;
      const currentValue = element.value;
      element.value = currentValue.slice(0, cursorPos) + char + currentValue.slice(cursorPos);
      element.setSelectionRange(cursorPos + 1, cursorPos + 1);
      
      events[2] && element.dispatchEvent(events[2]);
      events[3] && element.dispatchEvent(events[3]);
    }

    async simulateBackspace(element) {
      const events = [
        new KeyboardEvent('keydown', { key: 'Backspace', keyCode: 8, bubbles: true, cancelable: true }),
        new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true }),
        new KeyboardEvent('keyup', { key: 'Backspace', keyCode: 8, bubbles: true, cancelable: true })
      ];
      
      element.dispatchEvent(events[0]);
      
      const cursorPos = element.selectionStart || 0;
      if (cursorPos > 0) {
        const currentValue = element.value;
        element.value = currentValue.slice(0, cursorPos - 1) + currentValue.slice(cursorPos);
        element.setSelectionRange(cursorPos - 1, cursorPos - 1);
      }
      
      element.dispatchEvent(events[1]);
      element.dispatchEvent(events[2]);
    }

    async simulateRangeInput(element, value) {
      const min = parseInt(element.min) || 0;
      const max = parseInt(element.max) || 100;
      const clampedValue = Math.max(min, Math.min(max, value));
      
      element.value = clampedValue.toString();
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      await this.humanDelay(200, 500);
    }

    async simulateNaturalMouseMovement(targetX, targetY) {
      if (!this.settings.simulateMouseMovement) return;
      
      const startX = this.currentMouseX;
      const startY = this.currentMouseY;
      const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
      const steps = Math.max(5, Math.floor(distance / 50));
      
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        
        const curve = Math.sin(progress * Math.PI) * 15;
        const x = startX + (targetX - startX) * progress + (Math.random() - 0.5) * 3;
        const y = startY + (targetY - startY) * progress + curve + (Math.random() - 0.5) * 3;
        
        const mouseMoveEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        
        document.dispatchEvent(mouseMoveEvent);
        
        this.currentMouseX = x;
        this.currentMouseY = y;
        
        await this.humanDelay(8, 25);
      }
    }

    async handleSubmission() {
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Submit")',
        'button:contains("Send")',
        'button:contains("Complete")',
        '.submit-btn',
        '.submit-button'
      ];
      
      let submitButton = null;
      
      for (const selector of submitSelectors) {
        submitButton = document.querySelector(selector);
        if (submitButton) break;
      }
      
      if (!submitButton) {
        const buttons = Array.from(document.querySelectorAll('button'));
        submitButton = buttons.find(button => {
          const text = button.textContent?.toLowerCase() || '';
          return text.includes('submit') || text.includes('send') || text.includes('complete');
        });
      }
      
      if (submitButton && this.isElementVisible(submitButton)) {
        console.log('🎯 Found submit button, preparing to submit...');
        
        await this.humanDelay(1500, 3000);
        await this.focusOnElement(submitButton);
        await this.humanDelay(500, 1200);
        await this.simulateClick(submitButton);
        
        console.log('📤 Survey submitted!');
        await this.humanDelay(2000, 4000);
      } else {
        console.log('⚠️ No submit button found');
      }
    }

    parseRatingResponse(response) {
      const match = response.match(/\d+/);
      if (match) {
        return parseInt(match[0]);
      }
      
      const responseLower = response.toLowerCase();
      if (responseLower.includes('excellent') || responseLower.includes('great')) return 5;
      if (responseLower.includes('good') || responseLower.includes('satisfied')) return 4;
      if (responseLower.includes('okay') || responseLower.includes('average')) return 3;
      if (responseLower.includes('poor') || responseLower.includes('bad')) return 2;
      if (responseLower.includes('terrible') || responseLower.includes('awful')) return 1;
      
      return Math.floor(Math.random() * 5) + 1;
    }

    async humanDelay(min, max) {
      if (!this.settings.useRandomDelays) {
        await new Promise(resolve => setTimeout(resolve, min));
        return;
      }
      
      const delay = Math.floor(Math.random() * (max - min + 1)) + min;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Add CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Initialize the bot
  setTimeout(() => {
    new UniversalSurveyBot();
  }, 1000);

})();