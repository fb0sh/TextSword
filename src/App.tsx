import React from "react";
import { Button, ButtonGroup, TextInput } from "@primer/react";
import { FormControl, Textarea } from '@primer/react';

interface ReplaceRule {
  find: string;
  replace: string;
}

function ReplaceRulesList({
  rules,
  onChange,
  onRemove,
  style
}: {
  rules: ReplaceRule[];
  onChange: (index: number, newRule: ReplaceRule) => void;
  onRemove: (index: number) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ marginBottom: "1rem", maxHeight: "200px", overflowY: "auto", ...style }}>
      {rules.map((rule, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8, marginTop: 8 }}
        >
          <TextInput
            value={rule.find}
            onChange={(e) =>
              onChange(i, { find: e.target.value, replace: rule.replace })
            }
            placeholder="查找内容"
            sx={{ flex: 1 }}
          />

          <TextInput
            value={rule.replace}
            onChange={(e) =>
              onChange(i, { find: rule.find, replace: e.target.value })
            }
            placeholder="替换为"
            sx={{ flex: 1 }}
          />
          <Button variant="danger" onClick={() => onRemove(i)}>
            ✕
          </Button>
        </div>
      ))}
    </div>
  );
}

interface StoreButtonBoxProps {
  onImport: () => void;
  onExport: () => void;
  onClear: () => void;
  onClearRules: () => void;
}

function StoreButtonBox({ onImport, onExport, onClear, onClearRules }: StoreButtonBoxProps) {
  return (
    <ButtonGroup>
      <Button onClick={onClear} variant="danger">清空</Button>
      <Button onClick={onClearRules} variant="danger">清空规则</Button>
      <Button onClick={onImport}>导入</Button>
      <Button onClick={onExport} variant="primary">导出</Button>
    </ButtonGroup>
  );
}

export function FunctionButtonsBox({
  onFillBack,
  onUndoFill,
  onDistinct,
  onAsc,
  onDesc,
  onAddRule,
  onReplace,
}: {
  onFillBack: () => void;
  onUndoFill: () => void;
  onDistinct: () => void;
  onAsc: () => void;
  onDesc: () => void;
  onAddRule: () => void;
  onReplace: () => void;
}) {
  return (
    <ButtonGroup>
      <Button onClick={onFillBack}>回填</Button>
      <Button onClick={onUndoFill} variant="danger">撤销</Button>
      <Button onClick={onDistinct}>去重</Button>
      <Button onClick={onAsc}>升序</Button>
      <Button onClick={onDesc}>降序</Button>
      <Button onClick={onAddRule}>添加规则</Button>
      <Button variant="primary" onClick={onReplace}>
        替换
      </Button>
    </ButtonGroup>
  );
}

interface TextAreaBoxProps {
  inputValue: string;
  outputValue: string;
  onInputChange: (val: string) => void;
  onOutputChange: (val: string) => void;
  style?: React.CSSProperties;
}

export function TextAreaBox({
  inputValue,
  outputValue,
  onInputChange,
  onOutputChange,
  style,
}: TextAreaBoxProps) {
  const lineCount = (s: string) => {
    const lines = s.split('\n');
    return lines[0].trim() === '' ? lines.length - 1 : lines.length;
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      <FormControl
        required
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <FormControl.Label>输入：{lineCount(inputValue)}</FormControl.Label>
        <Textarea
          sx={{ width: '100%', flex: 1 }}
          resize="none"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
        />
      </FormControl>
      <FormControl
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <FormControl.Label>输出：{lineCount(outputValue)}</FormControl.Label>
        <Textarea
          sx={{ width: '100%', flex: 1 }}
          resize="none"
          value={outputValue}
          onChange={(e) => onOutputChange(e.target.value)}
        />
      </FormControl>
    </div>
  );
}

function App() {
  const [inputValue, setInputValue] = React.useState(() => localStorage.getItem("ts_input") || "");
  const [outputValue, setOutputValue] = React.useState(() => localStorage.getItem("ts_output") || "");
  const [rules, setRules] = React.useState<ReplaceRule[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("ts_rules") || "[]") || [{ find: "", replace: "" }];
    } catch {
      return [{ find: "", replace: "" }];
    }
  });
  const [backupInputValue, setBackupInputValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem("ts_input", inputValue);
  }, [inputValue]);

  React.useEffect(() => {
    localStorage.setItem("ts_output", outputValue);
  }, [outputValue]);

  React.useEffect(() => {
    localStorage.setItem("ts_rules", JSON.stringify(rules));
  }, [rules]);

  const onFillBack = () => {
    setBackupInputValue(inputValue);
    setInputValue(outputValue);
  };

  const onUndoFill = () => {
    if (backupInputValue !== null) {
      setInputValue(backupInputValue);
      setBackupInputValue(null);
    }
  };

  const onDistinct = () => {
    const lines = outputValue.split('\n');
    const uniqueLines = Array.from(new Set(lines.map(l => l.trim()))).filter(l => l.length > 0);
    setOutputValue(uniqueLines.join('\n'));
  };

  const onAsc = () => {
    const lines = outputValue.split('\n');
    const sorted = lines.map(l => l.trim()).filter(l => l.length > 0).sort();
    setOutputValue(sorted.join('\n'));
  };

  const onDesc = () => {
    const lines = outputValue.split('\n');
    const sorted = lines.map(l => l.trim()).filter(l => l.length > 0).sort().reverse();
    setOutputValue(sorted.join('\n'));
  };

  const onAddRule = () => {
    setRules((prev) => [...prev, { find: "", replace: "" }]);
  };

  const parseEscaped = (str: string) => {
    try {
      return JSON.parse(`"${str.replace(/"/g, '\\"')}"`);
    } catch {
      return str;
    }
  };

const onReplace = () => {
  let text = inputValue;

  for (const rule of rules) {
    if (!rule.find) continue;

    try {
      let pattern: RegExp;

      // 解析查找规则
      if (rule.find.startsWith('/') && rule.find.lastIndexOf('/') > 0) {
        // 正则格式 /xxx/flags
        const lastSlash = rule.find.lastIndexOf('/');
        const body = rule.find.slice(1, lastSlash);
        const flags = rule.find.slice(lastSlash + 1);
        pattern = new RegExp(body, flags);
      } else {
        // 普通文本 → 转义成安全正则
        const escapedFind = parseEscaped(rule.find)
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(escapedFind, 'g');
      }

      // 解析替换内容里的 \n \t 等
      const replacement = parseEscaped(rule.replace);

      text = text.replace(pattern, replacement);
    } catch (err) {
      console.error(`Invalid regex: ${rule.find}`, err);
      alert(`无效的正则: ${rule.find}`);
    }
  }

  setOutputValue(text);
};

  const onChangeRule = (index: number, newRule: ReplaceRule) => {
    setRules((prev) => {
      const copy = [...prev];
      copy[index] = newRule;
      return copy;
    });
  };

  const onRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const onImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        if (/[^\u0000-\uFFFF]/.test(text)) {
          alert("文件可能不是 UTF-8 编码");
          return;
        }
        setInputValue(text);
      };
      reader.onerror = () => alert("读取文件失败");
      reader.readAsText(file, "utf-8");
    };
    input.click();
  };

  const onExport = () => {
    const blob = new Blob([outputValue], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `TextSword_${dateStr}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onClear = () => {
    setInputValue("");
    setOutputValue("");
  };

  const onClearRules = () => {
    setRules([{ find: "", replace: "" }]);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        backgroundColor: "var(--bgColor-inset)",
        borderRadius: "var(--borderRadius-medium)",
        padding: "var(--stack-padding-spacious)",
        height: "100vh",
        width: "100vw",
      }}
    >
      <div style={{ flex: "0 0 70%", width: "100%", padding: "1rem 1rem 0 1rem", boxSizing: 'border-box' }}>
        <TextAreaBox
          style={{ height: "100%" }}
          inputValue={inputValue}
          onInputChange={setInputValue}
          outputValue={outputValue}
          onOutputChange={setOutputValue}
        />
      </div>
      <div style={{ flex: "0 0 auto", width: "100%", padding: "0 1rem 1rem 1rem", boxSizing: 'border-box', display: "flex", justifyContent: "space-between" }}>
        <FunctionButtonsBox
          onFillBack={onFillBack}
          onUndoFill={onUndoFill}
          onDistinct={onDistinct}
          onAsc={onAsc}
          onDesc={onDesc}
          onAddRule={onAddRule}
          onReplace={onReplace}
        />
        <StoreButtonBox onImport={onImport} onExport={onExport} onClear={onClear} onClearRules={onClearRules} />
      </div>
      <ReplaceRulesList
        style={{ padding: "0 1rem 0 1rem" }}
        rules={rules}
        onChange={onChangeRule}
        onRemove={onRemoveRule}
      />
    </div>
  );
}

export default App;
