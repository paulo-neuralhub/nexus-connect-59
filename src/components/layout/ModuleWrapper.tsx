/**
 * Module Wrappers
 * PROMPT 50: Layout wrappers with ModuleGate for each module
 */

import { ReactNode } from 'react';
import { ModuleGate, ModuleCode } from '@/components/common/ModuleGate';

interface ModuleWrapperProps {
  children: ReactNode;
  showUpgrade?: boolean;
}

/**
 * Wrapper for CRM module
 */
export function CRMWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="crm" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Wrapper for Marketing module
 */
export function MarketingWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="marketing" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Wrapper for Spider module
 */
export function SpiderWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="spider" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Wrapper for Genius (AI) module
 */
export function GeniusWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="genius" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Wrapper for Finance module
 */
export function FinanceWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="finance" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Wrapper for Market module
 */
export function MarketWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="market" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Wrapper for Data Hub module
 */
export function DataHubWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="datahub" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Wrapper for Analytics module
 */
export function AnalyticsWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="analytics" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Wrapper for Legal Ops module
 */
export function LegalOpsWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="legalops" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Wrapper for API module
 */
export function APIWrapper({ children, showUpgrade = true }: ModuleWrapperProps) {
  return (
    <ModuleGate module="api" showUpgrade={showUpgrade}>
      {children}
    </ModuleGate>
  );
}

/**
 * Generic module wrapper factory
 */
export function createModuleWrapper(moduleCode: ModuleCode) {
  return function ModuleWrap({ children, showUpgrade = true }: ModuleWrapperProps) {
    return (
      <ModuleGate module={moduleCode} showUpgrade={showUpgrade}>
        {children}
      </ModuleGate>
    );
  };
}
