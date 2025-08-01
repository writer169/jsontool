import React, { useState, useEffect } from 'react';
import { Moon, Sun, ArrowRight, X, MoreVertical, Copy, FileText, CheckCircle } from 'lucide-react';

const JSONFormatter = () => {
  const [input, setInput] = useState('');
  const [url, setUrl] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showResult, setShowResult] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkMode);
      const storedDarkMode = localStorage.getItem('darkMode');
      if (storedDarkMode !== null) {
        setDarkMode(storedDarkMode === 'true');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode);
      if (darkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  }, [darkMode]);

  // Закрытие контекстного меню при клике вне его
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Очистка сообщений через 5 секунд
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Форматирование JSON
  const formatJSON = (textInput) => {
    const jsonText = textInput !== undefined ? textInput : input;
    if (!jsonText.trim()) {
      setError('Пожалуйста, введите JSON для форматирования');
      setParsedData(null);
      setSuccess('');
      return;
    }
    try {
      const parsedJSON = JSON.parse(jsonText);
      setParsedData(parsedJSON);
      setError('');
      setSuccess('');
      const initialExpandedNodes = new Set();
      expandInitialNodes(parsedJSON, '', initialExpandedNodes, 0, 2);
      setExpandedNodes(initialExpandedNodes);
      setShowResult(true);
    } catch (err) {
      setError(`Ошибка: ${err.message}`);
      setParsedData(null);
      setSuccess('');
    }
  };

  // Загрузка JSON с URL
  const fetchFromUrl = async () => {
    if (!url.trim()) {
      setError('Пожалуйста, введите URL');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let response;
      let data;
      
      // Сначала пробуем прямой запрос
      try {
        console.log('Попытка прямого запроса...');
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
          },
          mode: 'cors',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ошибка! Статус: ${response.status}`);
        }
        
        data = await response.text();
        console.log('Прямой запрос успешен');
        setSuccess('Данные успешно загружены напрямую');
        
      } catch (corsError) {
        console.log('Прямой запрос не удался, используем серверный прокси...');
        
        // Используем наш серверный прокси
        try {
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Proxy error: ${response.status}`);
          }
          
          data = await response.text();
          console.log('Запрос через прокси успешен');
          setSuccess('Данные успешно загружены через серверный прокси');
          
        } catch (proxyError) {
          console.log('Серверный прокси не сработал, пробуем внешние прокси...');
          
          // Если и прокси не работает, пробуем внешние сервисы
          const externalProxies = [
            `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`
          ];
          
          let externalSuccess = false;
          
          for (const externalProxy of externalProxies) {
            try {
              response = await fetch(externalProxy);
              
              if (response.ok) {
                if (externalProxy.includes('allorigins.win')) {
                  const jsonResponse = await response.json();
                  data = jsonResponse.contents;
                } else {
                  data = await response.text();
                }
                externalSuccess = true;
                console.log(`Внешний прокси ${externalProxy} сработал`);
                setSuccess('Данные успешно загружены через внешний прокси');
                break;
              }
            } catch (extError) {
              console.log(`Внешний прокси ${externalProxy} не сработал:`, extError);
              continue;
            }
          }
          
          if (!externalSuccess) {
            throw new Error(
              `Не удалось загрузить данные из ${url}.\n\n` +
              `Возможные причины:\n` +
              `• CORS политика API не разрешает браузерные запросы\n` +
              `• Сервер временно недоступен\n` +
              `• Неправильный URL или параметры\n\n` +
              `Попробуйте:\n` +
              `• Скопировать JSON напрямую из браузера\n` +
              `• Проверить URL в новой вкладке браузера\n` +
              `• Использовать расширение для отключения CORS`
            );
          }
        }
      }
      
      // Проверяем и устанавливаем данные
      if (!data || data.trim() === '') {
        throw new Error('Получен пустой ответ от сервера');
      }
      
      // Проверяем, является ли ответ JSON
      try {
        JSON.parse(data);
        console.log('Полученные данные являются валидным JSON');
      } catch (parseError) {
        console.log('Ответ не является валидным JSON, но отображаем содержимое');
      }
      
      setInput(data);
      formatJSON(data);
      
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const expandInitialNodes = (data, path, expandedSet, currentLevel, maxLevel) => {
    if (currentLevel >= maxLevel) return;
    if (typeof data === 'object' && data !== null) {
      expandedSet.add(path);
      Object.keys(data).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        expandInitialNodes(data[key], newPath, expandedSet, currentLevel + 1, maxLevel);
      });
    }
  };

  const toggleNode = (path) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(path)) {
      newExpandedNodes.delete(path);
    } else {
      newExpandedNodes.add(path);
    }
    setExpandedNodes(newExpandedNodes);
  };

  // Открытие контекстного меню
  const handleShowContextMenu = (e, path, value, key) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Отображаем посередине экрана
    setContextMenu({
      path,
      value,
      key
    });
  };

  // Копирование в буфер обмена
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setContextMenu(null);
    } catch (err) {
      console.error('Ошибка при копировании в буфер обмена:', err);
    }
  };

  const copyName = () => {
    if (contextMenu && contextMenu.key) {
      copyToClipboard(contextMenu.key);
    }
  };

  const copyValue = () => {
    if (contextMenu) {
      const value = typeof contextMenu.value === 'object' && contextMenu.value !== null
        ? JSON.stringify(contextMenu.value, null, 2)
        : String(contextMenu.value);
      copyToClipboard(value);
    }
  };

  const copyPath = () => {
    if (contextMenu && contextMenu.path) {
      copyToClipboard(contextMenu.path);
    }
  };

  // Работа с буфером обмена и полями ввода
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      formatJSON(text);
    } catch (err) {
      console.error('Ошибка чтения из буфера обмена:', err);
    }
  };

  const clearInput = () => {
    setInput('');
    setUrl('');
    setError('');
    setSuccess('');
  };

  const goBack = () => {
    setShowResult(false);
  };

  // Обрезка длинных строк для отображения
  const truncateIfNeeded = (str, maxLength = 150) => {
    if (typeof str === 'string' && str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }
    return str;
  };

  // Отрисовка узлов JSON
  const renderJSONNode = (data, path = '', depth = 0, parentKey = '') => {
    if (data === null) {
      return (
        <div className="json-row">
          <div className="json-content">
            <span className="json-null">null</span>
          </div>
          <button 
            className="context-menu-button" 
            onClick={(e) => handleShowContextMenu(e, path, data, parentKey)}
            aria-label="Открыть меню"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      );
    }
    
    if (typeof data !== 'object') {
      const valueClass = 
        typeof data === 'string' ? 'json-string' :
        typeof data === 'number' ? 'json-number' :
        typeof data === 'boolean' ? 'json-boolean' : '';
      
      const displayValue = 
        typeof data === 'string' ? `"${truncateIfNeeded(data)}"` : String(data);
      
      return (
        <div className="json-row">
          <div className="json-content">
            <span className={valueClass}>{displayValue}</span>
          </div>
          <button 
            className="context-menu-button" 
            onClick={(e) => handleShowContextMenu(e, path, data, parentKey)}
            aria-label="Открыть меню"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      );
    }
    
    const isArray = Array.isArray(data);
    const items = isArray ? data : Object.keys(data);
    const isExpanded = expandedNodes.has(path);
    const hasChildren = items.length > 0;
    const childrenCount = items.length;
    const nodeKey = path.split('.').pop() || '';
    
    return (
      <div className="json-object-container">
        <div className="json-row">
          <div 
            className="json-content"
            onClick={(e) => {
              e.stopPropagation();
              hasChildren && toggleNode(path);
            }}
          >
            {hasChildren && (
              <span className="expander">{isExpanded ? '▼' : '►'}</span>
            )}
            
            {path ? (
              <span className="json-key">{nodeKey}</span>
            ) : (
              <span className={isArray ? "json-bracket" : "json-key"}>
                {isArray ? `ARRAY [${childrenCount}]` : `OBJECT {${childrenCount}}`}
              </span>
            )}
            
            {!isExpanded && hasChildren && (
              <span className="json-preview">
                {isArray ? `[${childrenCount}]` : `{${childrenCount}}`}
              </span>
            )}
          </div>
          
          <button 
            className="context-menu-button" 
            onClick={(e) => handleShowContextMenu(e, path, data, nodeKey)}
            aria-label="Открыть меню"
          >
            <MoreVertical size={16} />
          </button>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="json-children">
            {isArray ? (
              items.map((item, index) => (
                <div key={index} className="json-item">
                  {renderJSONNode(item, `${path}[${index}]`, depth + 1, index.toString())}
                </div>
              ))
            ) : (
              Object.keys(data).map((key) => (
                <div key={key} className="json-item">
                  {typeof data[key] === 'object' && data[key] !== null ? (
                    <div className="json-object-property">
                      <div className="json-row">
                        <div 
                          className="json-content"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNode(path ? `${path}.${key}` : key);
                          }}
                        >
                          <span className="expander">
                            {expandedNodes.has(path ? `${path}.${key}` : key) ? '▼' : '►'}
                          </span>
                          <span className="json-key">{key}</span>
                        </div>
                        <button 
                          className="context-menu-button" 
                          onClick={(e) => handleShowContextMenu(e, path ? `${path}.${key}` : key, data[key], key)}
                          aria-label="Открыть меню"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                      {expandedNodes.has(path ? `${path}.${key}` : key) && (
                        <div className="json-children">
                          {renderJSONNode(data[key], path ? `${path}.${key}` : key, depth + 1, key)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="json-property">
                      <div className="json-row">
                        <div className="json-content">
                          <span className="json-key">{key}:</span>
                          {renderValueInline(data[key])}
                        </div>
                        <button 
                          className="context-menu-button" 
                          onClick={(e) => handleShowContextMenu(e, path ? `${path}.${key}` : key, data[key], key)}
                          aria-label="Открыть меню"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // Вспомогательная функция для отображения значений в одной строке
  const renderValueInline = (value) => {
    if (value === null) {
      return <span className="json-null">null</span>;
    }
    
    const valueClass = 
      typeof value === 'string' ? 'json-string' :
      typeof value === 'number' ? 'json-number' :
      typeof value === 'boolean' ? 'json-boolean' : '';
    
    const displayValue = 
      typeof value === 'string' ? `"${truncateIfNeeded(value)}"` : String(value);
    
    return <span className={valueClass}>{displayValue}</span>;
  };

  return (
    <div className="app-container">
      <main className={`${showResult ? 'result-view' : 'input-view'}`}>
        {showResult ? (
          <div className="result-container">
            <div className="header-bar">
              <button 
                onClick={goBack} 
                className="back-button"
              >
                Вернуться к вводу
              </button>
            </div>
            <div className="result-content">
              {renderJSONNode(parsedData)}
            </div>
          </div>
        ) : (
          <div className="input-container">
            <div className="input-actions">
              <button 
                onClick={pasteFromClipboard}
                className="action-button"
              >
                Вставить из буфера
              </button>
            </div>
            
            {/* Поле ввода URL */}
            <div className="url-input-container">
              <div className="url-input-wrapper">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="url-input"
                  placeholder="Введите URL для загрузки JSON..."
                  aria-label="URL для загрузки JSON"
                />
                {url && (
                  <button 
                    onClick={() => setUrl('')}
                    className="url-clear-button"
                    aria-label="Очистить URL"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <button 
                onClick={fetchFromUrl}
                className="fetch-button"
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    Загрузка...
                  </div>
                ) : (
                  'Загрузить'
                )}
              </button>
            </div>
            
            <div className="textarea-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') formatJSON();
                }}
                className="json-input"
                placeholder="Вставьте или введите JSON здесь..."
                aria-label="Поле ввода JSON"
              />
              {input && (
                <button 
                  onClick={clearInput}
                  className="clear-button"
                  aria-label="Очистить поле ввода"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button 
              onClick={() => formatJSON()}
              className="format-button"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        )}
        
        {/* Сообщение об успехе */}
        {success && (
          <div className="success-message">
            <CheckCircle size={16} />
            {success}
          </div>
        )}
        
        {/* Сообщение об ошибке */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </main>
      
      {/* Контекстное меню */}
      {contextMenu && (
        <div className="context-menu-overlay">
          <div className="context-menu">
            {contextMenu.key && (
              <button className="context-menu-item" onClick={copyName}>
                <Copy size={14} />
                <span>Копировать имя</span>
              </button>
            )}
            <button className="context-menu-item" onClick={copyValue}>
              <Copy size={14} />
              <span>Копировать значение</span>
            </button>
            {contextMenu.path && (
              <button className="context-menu-item" onClick={copyPath}>
                <FileText size={14} />
                <span>Копировать путь</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setDarkMode(!darkMode)} 
        className="theme-toggle"
        aria-label={darkMode ? "Включить светлую тему" : "Включить темную тему"}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
};

export default JSONFormatter;