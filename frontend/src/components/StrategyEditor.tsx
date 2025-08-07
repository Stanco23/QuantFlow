import { useEffect, useRef, useState } from 'react';
import Editor, { OnChange, OnMount } from '@monaco-editor/react';
import axios from 'axios';

interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

interface ValidationResponse {
  ast: any;
  errors: string[];
}

interface StrategyEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: string;
  className?: string;
}

export default function StrategyEditor({
  value = '',
  onChange,
  height = '400px',
  className = ''
}: StrategyEditorProps) {
  const [code, setCode] = useState(value);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Define DSL language configuration
  const defineQuantFlowDSL = (monaco: any) => {
    // Register a new language
    monaco.languages.register({ id: 'quantflow-dsl' });

    // Define tokens/keywords matching DSL grammar
    monaco.languages.setMonarchTokensProvider('quantflow-dsl', {
      tokenizer: {
        root: [
          // Comments
          [/\/\/.*$/, 'comment'],
          
          // Numbers
          [/\d+(\.\d+)?/, 'number'],
          
          // Strings
          [/"[^"]*"/, 'string'],
          
          // Keywords/operators
          [/\b(and|or|not)\b/, 'keyword'],
          [/\b(if|then|else)\b/, 'keyword'],
          
          // Price data keywords
          [/\b(open|high|low|close|volume)\b/, 'type'],
          
          // Technical analysis functions (Pine Script style)
          [/\b(ta\.sma|ta\.ema|ta\.rsi|ta\.atr|ta\.macd|ta\.bb|ta\.stoch|ta\.cci|ta\.crossover|ta\.crossunder)\b/, 'function'],
          [/\b(math\.abs|math\.max|math\.min)\b/, 'function'],
          [/\b(sma|ema|rsi|atr|macd|bollinger|stoch)\b/, 'function'],
          
          // Comparison operators
          [/(>=|<=|==|!=|>|<)/, 'operator'],
          
          // Arithmetic operators
          [/[+\-*\/\%\^]/, 'operator'],
          
          // Parentheses and punctuation
          [/[(),]/, 'delimiter'],
          
          // Identifiers (variables)
          [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
          
          // Whitespace
          [/[ \t\r\n]+/, 'white']
        ]
      }
    });

    // Define language configuration
    monaco.languages.setLanguageConfiguration('quantflow-dsl', {
      comments: {
        lineComment: '//'
      },
      brackets: [
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '"', close: '"' }
      ],
      surroundingPairs: [
        { open: '(', close: ')' },
        { open: '"', close: '"' }
      ]
    });

    // Define theme for syntax highlighting
    monaco.editor.defineTheme('quantflow-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'identifier', foreground: '9CDCFE' }
      ],
      colors: {
        'editor.background': '#1E1E1E'
      }
    });

    // Set up completion provider for IntelliSense
    monaco.languages.registerCompletionItemProvider('quantflow-dsl', {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions = [
          // Price data
          {
            label: 'close',
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: 'close',
            documentation: 'Current closing price'
          },
          {
            label: 'open',
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: 'open',
            documentation: 'Current opening price'
          },
          {
            label: 'high',
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: 'high',
            documentation: 'Current high price'
          },
          {
            label: 'low',
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: 'low',
            documentation: 'Current low price'
          },
          {
            label: 'volume',
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: 'volume',
            documentation: 'Current volume'
          },
          
          // Technical indicators (classic style)
          {
            label: 'sma',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'sma(${1:close}, ${2:14})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Simple Moving Average'
          },
          {
            label: 'ema',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ema(${1:close}, ${2:14})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Exponential Moving Average'
          },
          {
            label: 'rsi',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'rsi(${1:close}, ${2:14})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Relative Strength Index'
          },
          {
            label: 'atr',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'atr(${1:14})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Average True Range'
          },
          
          // Pine Script-style technical analysis functions
          {
            label: 'ta.sma',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.sma(${1:close}, ${2:14})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Simple Moving Average (Pine Script style)'
          },
          {
            label: 'ta.ema',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.ema(${1:close}, ${2:14})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Exponential Moving Average (Pine Script style)'
          },
          {
            label: 'ta.rsi',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.rsi(${1:close}, ${2:14})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Relative Strength Index (Pine Script style)'
          },
          {
            label: 'ta.atr',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.atr(${1:14})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Average True Range (Pine Script style)'
          },
          {
            label: 'ta.macd',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.macd(${1:close}, ${2:12}, ${3:26}, ${4:9})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'MACD (Moving Average Convergence Divergence)'
          },
          {
            label: 'ta.bb',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.bb(${1:close}, ${2:20}, ${3:2})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Bollinger Bands'
          },
          {
            label: 'ta.stoch',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.stoch(${1:14}, ${2:1}, ${3:3})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Stochastic Oscillator'
          },
          {
            label: 'ta.cci',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.cci(${1:20})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Commodity Channel Index'
          },
          {
            label: 'ta.crossover',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.crossover(${1:series1}, ${2:series2})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Returns true when series1 crosses over series2'
          },
          {
            label: 'ta.crossunder',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'ta.crossunder(${1:series1}, ${2:series2})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Returns true when series1 crosses under series2'
          },
          
          // Math functions (Pine Script style)
          {
            label: 'math.abs',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'math.abs(${1:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Absolute value'
          },
          {
            label: 'math.max',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'math.max(${1:value1}, ${2:value2})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Maximum of two values'
          },
          {
            label: 'math.min',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'math.min(${1:value1}, ${2:value2})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Minimum of two values'
          },
          
          // Logical operators
          {
            label: 'and',
            kind: monaco.languages.CompletionItemKind.Operator,
            insertText: 'and',
            documentation: 'Logical AND operator'
          },
          {
            label: 'or',
            kind: monaco.languages.CompletionItemKind.Operator,
            insertText: 'or',
            documentation: 'Logical OR operator'
          },
          {
            label: 'not',
            kind: monaco.languages.CompletionItemKind.Operator,
            insertText: 'not',
            documentation: 'Logical NOT operator'
          }
        ];

        return { suggestions };
      }
    });
  };

  // Validate code with backend
  const validateCode = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) {
      setErrors([]);
      return;
    }

    setIsValidating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.post<ValidationResponse>(`${apiUrl}/parser/validate`, {
        code: codeToValidate
      });

      const parseErrors: ParseError[] = response.data.errors.map(errorMsg => {
        // Try to extract line/column info from error message if available
        const lineMatch = errorMsg.match(/line (\d+)/i);
        const columnMatch = errorMsg.match(/column (\d+)/i);
        
        return {
          message: errorMsg,
          line: lineMatch ? parseInt(lineMatch[1]) : undefined,
          column: columnMatch ? parseInt(columnMatch[1]) : undefined
        };
      });

      setErrors(parseErrors);
      
      // Update Monaco editor markers for syntax errors
      if (monacoRef.current && editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          const markers = parseErrors.map(error => ({
            severity: monacoRef.current.MarkerSeverity.Error,
            startLineNumber: error.line || 1,
            startColumn: error.column || 1,
            endLineNumber: error.line || 1,
            endColumn: error.column ? error.column + 1 : model.getLineLength(error.line || 1),
            message: error.message
          }));
          
          monacoRef.current.editor.setModelMarkers(model, 'quantflow-dsl', markers);
        }
      }
    } catch (error) {
      console.error('Error validating code:', error);
      setErrors([{ message: 'Failed to validate code with server' }]);
    } finally {
      setIsValidating(false);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Define the DSL language
    defineQuantFlowDSL(monaco);
    
    // Set the theme
    monaco.editor.setTheme('quantflow-theme');
    
    // Initial validation
    validateCode(code);
  };

  const handleEditorChange: OnChange = (value) => {
    const newCode = value || '';
    setCode(newCode);
    onChange?.(newCode);
    
    // Debounced validation
    const timeoutId = setTimeout(() => {
      validateCode(newCode);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Update code when value prop changes
  useEffect(() => {
    if (value !== code) {
      setCode(value);
      validateCode(value);
    }
  }, [value]);

  return (
    <div className={`strategy-editor ${className}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>Strategy Code Editor</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isValidating && (
            <span style={{ fontSize: '12px', color: '#3b82f6' }}>Validating...</span>
          )}
          {errors.length > 0 && (
            <span style={{ fontSize: '12px', color: '#ef4444' }}>
              {errors.length} error{errors.length > 1 ? 's' : ''}
            </span>
          )}
          {!isValidating && errors.length === 0 && code.trim() && (
            <span style={{ fontSize: '12px', color: '#10b981' }}>✓ Valid</span>
          )}
        </div>
      </div>
      
      <div style={{ 
        flex: 1, 
        border: '1px solid #374151', 
        borderRadius: '8px', 
        overflow: 'hidden',
        minHeight: height === '100%' ? '300px' : height
      }}>
        <Editor
          height={height === '100%' ? '100%' : height}
          defaultLanguage="quantflow-dsl"
          language="quantflow-dsl"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            fontSize: 14,
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            // Enable IntelliSense
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            },
            parameterHints: {
              enabled: true
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            accessibilitySupport: 'auto'
          }}
        />
      </div>
      
      {/* Error display */}
      {errors.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px'
        }}>
          <h4 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#ef4444',
            marginBottom: '8px'
          }}>Syntax Errors:</h4>
          <ul style={{
            fontSize: '12px',
            color: '#fca5a5',
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            {errors.map((error, index) => (
              <li key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontFamily: 'monospace',
                  marginRight: '8px',
                  color: '#ef4444'
                }}>
                  {error.line && `Line ${error.line}${error.column ? `:${error.column}` : ''}`}
                </span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Help text */}
      <div style={{
        marginTop: '12px',
        fontSize: '11px',
        color: '#9ca3af'
      }}>
        <p style={{ fontWeight: '600', marginBottom: '4px' }}>Syntax Help:</p>
        <ul style={{
          listStyle: 'disc',
          paddingLeft: '16px',
          margin: 0,
          lineHeight: '1.4'
        }}>
          <li><code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>close</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>open</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>high</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>low</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>volume</code> - Price data fields</li>
          <li><code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>sma(source, period)</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>ema(source, period)</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>rsi(source, period)</code> - Technical indicators</li>
          <li><code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>and</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>or</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>not</code> - Logical operators</li>
          <li><code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>&gt;</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>&lt;</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>&gt;=</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>&lt;=</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>==</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>!=</code> - Comparison operators</li>
          <li><code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>+</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>-</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>*</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>/</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>%</code>, <code style={{ backgroundColor: '#374151', padding: '2px 4px', borderRadius: '3px' }}>^</code> - Arithmetic operators</li>
        </ul>
      </div>
    </div>
  );
}
