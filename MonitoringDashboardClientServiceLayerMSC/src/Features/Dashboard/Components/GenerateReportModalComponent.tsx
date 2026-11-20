import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileBarChart } from 'lucide-react';
import ModalSharedComponent from '../../../Shared/Components/ModalSharedComponent';
import ButtonSharedComponent from '../../../Shared/Components/ButtonSharedComponent';
import CustomSelectSharedComponent from '../../../Shared/Components/CustomSelectSharedComponent';
import DateRangePickerSharedComponent, {
  type DateRangeType,
} from '../../../Shared/Components/DateRangePickerSharedComponent';
import DashboardCON from '../Constants/DashboardCON';
import ReportService from '../../../Services/ReportService';
import type { AvailableCategoriesType, DayCompletenessStateType, ReportCategoryKeyType } from '../../../Types';

export interface GenerateReportModalComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: { environment: string; startDate: string; endDate: string; selectedKeys: string[] }) => void;
}

interface SimpleCategoryDef {
  key: ReportCategoryKeyType;
  label: string;
}

interface ExpandableCategoryDef {
  key: ReportCategoryKeyType;
  label: string;
  availableKey: keyof AvailableCategoriesType;
}

class GenerateReportModalCON {
  public static readonly SIMPLE_CATEGORIES: SimpleCategoryDef[] = [
    { key: 'AuthenticationLogin', label: 'Authentication Login' },
    { key: 'AuthenticationPing', label: 'Authentication Ping' },
    { key: 'IndexingFreshness', label: 'Indexing Freshness' },
  ];

  public static readonly EXPANDABLE_CATEGORIES: ExpandableCategoryDef[] = [
    { key: 'PageLoad', label: 'Page Loads', availableKey: 'pageLoad' },
    { key: 'AtlasWidget', label: 'Atlas Widgets', availableKey: 'atlasWidget' },
    { key: 'QueueStatus', label: 'Queue Status', availableKey: 'queueStatus' },
  ];

  public static readonly DAY_COMPLETENESS_DOT_CLASS: Record<DayCompletenessStateType, string> = {
    complete: 'after:content-[""] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-emerald-500',
    partial: 'after:content-[""] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-amber-500',
    empty: '',
  };
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultLastSevenDays(): DateRangeType {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  return { start: toDateKey(start), end: toDateKey(today) };
}

// Native checkbox "indeterminate" has no React prop - must be set imperatively.
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-zinc-700 text-[#0C2086] focus:ring-[#0C2086] shrink-0 cursor-pointer"
    />
  );
}

export default function GenerateReportModalComponent({
  isOpen,
  onClose,
  onGenerate,
}: GenerateReportModalComponentProps): React.JSX.Element {
  const [environment, setEnvironment] = useState<string>(DashboardCON.ENVIRONMENTS[0].value);
  const [dateRange, setDateRange] = useState<DateRangeType>(() => defaultLastSevenDays());
  const [visibleMonthRange, setVisibleMonthRange] = useState<DateRangeType | null>(null);
  const [dayCompleteness, setDayCompleteness] = useState<Record<string, DayCompletenessStateType>>({});
  const [availableCategories, setAvailableCategories] = useState<AvailableCategoriesType | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<ReportCategoryKeyType>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen || !visibleMonthRange) return;
    ReportService.current
      .getDayCompleteness(environment, visibleMonthRange.start, visibleMonthRange.end)
      .then(setDayCompleteness)
      .catch(() => setDayCompleteness({}));
  }, [isOpen, environment, visibleMonthRange]);

  useEffect(() => {
    if (!isOpen) return;
    ReportService.current
      .getAvailableCategories(environment, dateRange.start, dateRange.end)
      .then(setAvailableCategories)
      .catch(() => setAvailableCategories(null));
  }, [isOpen, environment, dateRange]);

  const toggleKey = (key: string): void => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategoryExpanded = (key: ReportCategoryKeyType): void => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllSubItems = (category: ExpandableCategoryDef, items: string[]): void => {
    const itemKeys = items.map((item) => `${category.key}:${item}`);
    const allSelected = itemKeys.length > 0 && itemKeys.every((key) => selectedKeys.has(key));
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      for (const key of itemKeys) {
        if (allSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  };

  const handleGenerate = (): void => {
    onGenerate({
      environment,
      startDate: dateRange.start,
      endDate: dateRange.end,
      selectedKeys: Array.from(selectedKeys),
    });
  };

  return (
    <ModalSharedComponent
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Report"
      subtitle="Choose a time range and which checks to include"
      maxWidth="md"
      footer={
        <div className="flex justify-end">
          <ButtonSharedComponent
            variant="primary"
            size="md"
            onClick={handleGenerate}
            disabled={selectedKeys.size === 0}
            icon={<FileBarChart className="w-4 h-4" />}
          >
            Generate
          </ButtonSharedComponent>
        </div>
      }
    >
      <div className="space-y-4">
        <CustomSelectSharedComponent
          label="Environment"
          value={environment}
          onChange={setEnvironment}
          options={DashboardCON.ENVIRONMENTS}
          size="sm"
        />

        <DateRangePickerSharedComponent
          label="Date Range"
          value={dateRange}
          onChange={setDateRange}
          onVisibleMonthChange={(start, end) => setVisibleMonthRange({ start, end })}
          dayClassName={(dateKey) => GenerateReportModalCON.DAY_COMPLETENESS_DOT_CLASS[dayCompleteness[dateKey] ?? 'empty']}
          size="sm"
        />

        <div>
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5 block">Checks to include</span>
          <div className="rounded-lg border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/60 overflow-hidden">
            {GenerateReportModalCON.SIMPLE_CATEGORIES.map((category) => (
              <label key={category.key} className="flex items-center gap-2.5 px-3 py-2.5 text-xs select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedKeys.has(category.key)}
                  onChange={() => toggleKey(category.key)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-zinc-700 text-[#0C2086] focus:ring-[#0C2086] shrink-0 cursor-pointer"
                />
                <span className="font-medium text-slate-700 dark:text-zinc-200">{category.label}</span>
              </label>
            ))}

            {GenerateReportModalCON.EXPANDABLE_CATEGORIES.map((category) => {
              const items = availableCategories?.[category.availableKey] ?? [];
              const itemKeys = items.map((item) => `${category.key}:${item}`);
              const selectedCount = itemKeys.filter((key) => selectedKeys.has(key)).length;
              const isExpanded = expandedCategories.has(category.key);

              return (
                <div key={category.key}>
                  <div className="flex items-center gap-2.5 px-3 py-2.5 text-xs">
                    <IndeterminateCheckbox
                      checked={itemKeys.length > 0 && selectedCount === itemKeys.length}
                      indeterminate={selectedCount > 0 && selectedCount < itemKeys.length}
                      onChange={() => toggleAllSubItems(category, items)}
                    />
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpanded(category.key)}
                      disabled={items.length === 0}
                      className="flex-1 flex items-center justify-between gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="font-medium text-slate-700 dark:text-zinc-200">{category.label}</span>
                      <span className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                        {items.length === 0 ? (
                          <span className="font-mono">No data</span>
                        ) : (
                          <span className="font-mono">{selectedCount}/{itemKeys.length}</span>
                        )}
                        {items.length > 0 && (
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </span>
                    </button>
                  </div>

                  {isExpanded && items.length > 0 && (
                    <div className="pl-9 pb-1.5 space-y-0.5">
                      {items.map((item) => {
                        const itemKey = `${category.key}:${item}`;
                        return (
                          <label key={itemKey} className="flex items-center gap-2.5 py-1 text-xs select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedKeys.has(itemKey)}
                              onChange={() => toggleKey(itemKey)}
                              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-zinc-700 text-[#0C2086] focus:ring-[#0C2086] shrink-0 cursor-pointer"
                            />
                            <span className="text-slate-600 dark:text-zinc-300">{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModalSharedComponent>
  );
}
