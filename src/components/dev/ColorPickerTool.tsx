import { useState } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';

interface ColorSet {
  name: string;
  cssVar: string;
  defaultValue: string;
  currentValue: string;
}

export default function ColorPickerTool() {
  const [isOpen, setIsOpen] = useState(false);
  const [colors, setColors] = useState<ColorSet[]>([
    // Ocean colors
    { name: 'Ocean 50', cssVar: '--color-ocean-50', defaultValue: '#f0f9ff', currentValue: '#f0f9ff' },
    { name: 'Ocean 100', cssVar: '--color-ocean-100', defaultValue: '#e0f2fe', currentValue: '#e0f2fe' },
    { name: 'Ocean 200', cssVar: '--color-ocean-200', defaultValue: '#b9e6fe', currentValue: '#b9e6fe' },
    { name: 'Ocean 300', cssVar: '--color-ocean-300', defaultValue: '#7dd3fc', currentValue: '#7dd3fc' },
    { name: 'Ocean 400', cssVar: '--color-ocean-400', defaultValue: '#38bdf8', currentValue: '#38bdf8' },
    { name: 'Ocean 500', cssVar: '--color-ocean-500', defaultValue: '#0ea5e9', currentValue: '#0ea5e9' },
    { name: 'Ocean 600', cssVar: '--color-ocean-600', defaultValue: '#0284c7', currentValue: '#0284c7' },
    { name: 'Ocean 700', cssVar: '--color-ocean-700', defaultValue: '#0369a1', currentValue: '#0369a1' },
    { name: 'Ocean 800', cssVar: '--color-ocean-800', defaultValue: '#075985', currentValue: '#075985' },
    { name: 'Ocean 900', cssVar: '--color-ocean-900', defaultValue: '#0c4a6e', currentValue: '#0c4a6e' },

    // Coral colors
    { name: 'Coral 400', cssVar: '--color-coral-400', defaultValue: '#fb923c', currentValue: '#fb923c' },
    { name: 'Coral 500', cssVar: '--color-coral-500', defaultValue: '#f97316', currentValue: '#f97316' },

    // Sand colors
    { name: 'Sand 100', cssVar: '--color-sand-100', defaultValue: '#fef3c7', currentValue: '#fef3c7' },
    { name: 'Sand 200', cssVar: '--color-sand-200', defaultValue: '#fde68a', currentValue: '#fde68a' },
    { name: 'Sand 300', cssVar: '--color-sand-300', defaultValue: '#fcd34d', currentValue: '#fcd34d' },

    // Seaweed colors
    { name: 'Seaweed 50', cssVar: '--color-seaweed-50', defaultValue: '#f0fdf4', currentValue: '#f0fdf4' },
    { name: 'Seaweed 500', cssVar: '--color-seaweed-500', defaultValue: '#10b981', currentValue: '#10b981' },
    { name: 'Seaweed 600', cssVar: '--color-seaweed-600', defaultValue: '#059669', currentValue: '#059669' },
    { name: 'Seaweed 700', cssVar: '--color-seaweed-700', defaultValue: '#047857', currentValue: '#047857' },
    { name: 'Seaweed 800', cssVar: '--color-seaweed-800', defaultValue: '#065f46', currentValue: '#065f46' },
  ]);

  const handleColorChange = (index: number, newColor: string) => {
    const updated = [...colors];
    updated[index].currentValue = newColor;
    setColors(updated);

    // Apply to CSS
    document.documentElement.style.setProperty(updated[index].cssVar, newColor);
  };

  const handleReset = () => {
    const reset = colors.map(c => ({ ...c, currentValue: c.defaultValue }));
    setColors(reset);

    // Reset CSS
    reset.forEach(c => {
      document.documentElement.style.setProperty(c.cssVar, c.defaultValue);
    });
  };

  const handleCopyCSS = () => {
    const css = `@theme {\n${colors.map(c => `  ${c.cssVar}: ${c.currentValue};`).join('\n')}\n}`;
    navigator.clipboard.writeText(css);
    alert('CSS copied to clipboard!');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#9333ea',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          zIndex: 9999,
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#9333ea')}
      >
        🎨 Theme Picker
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '384px',
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: 9999,
      }}
    >
      <Card className="shadow-2xl">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-bold text-gray-800">🎨 Theme Color Picker</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              Reset All
            </Button>
            <Button onClick={handleCopyCSS} variant="secondary" size="sm">
              Copy CSS
            </Button>
          </div>

          {/* Ocean Colors */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Ocean (Primary)</h3>
            <div className="space-y-2">
              {colors.filter(c => c.name.startsWith('Ocean')).map((color, _idx) => {
                const actualIndex = colors.findIndex(c => c.cssVar === color.cssVar);
                return (
                  <div key={color.cssVar} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color.currentValue}
                      onChange={(e) => handleColorChange(actualIndex, e.target.value)}
                      className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700">{color.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{color.currentValue}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coral Colors */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Coral (Accent)</h3>
            <div className="space-y-2">
              {colors.filter(c => c.name.startsWith('Coral')).map((color, _idx) => {
                const actualIndex = colors.findIndex(c => c.cssVar === color.cssVar);
                return (
                  <div key={color.cssVar} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color.currentValue}
                      onChange={(e) => handleColorChange(actualIndex, e.target.value)}
                      className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700">{color.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{color.currentValue}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sand Colors */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Sand (Light)</h3>
            <div className="space-y-2">
              {colors.filter(c => c.name.startsWith('Sand')).map((color, _idx) => {
                const actualIndex = colors.findIndex(c => c.cssVar === color.cssVar);
                return (
                  <div key={color.cssVar} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color.currentValue}
                      onChange={(e) => handleColorChange(actualIndex, e.target.value)}
                      className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700">{color.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{color.currentValue}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seaweed Colors */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Seaweed (Success)</h3>
            <div className="space-y-2">
              {colors.filter(c => c.name.startsWith('Seaweed')).map((color, _idx) => {
                const actualIndex = colors.findIndex(c => c.cssVar === color.cssVar);
                return (
                  <div key={color.cssVar} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color.currentValue}
                      onChange={(e) => handleColorChange(actualIndex, e.target.value)}
                      className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700">{color.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{color.currentValue}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-semibold mb-1">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click color swatches to adjust theme</li>
              <li>Changes apply instantly</li>
              <li>Click "Copy CSS" to save your theme</li>
              <li>Paste into src/index.css @theme block</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
