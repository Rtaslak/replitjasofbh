import { useState, useEffect } from 'react';
import environmentUtils from '@/utils/environmentUtils';

export interface EnvironmentInfo {
  isLocal: boolean;
  isTest: boolean;
  isProduction: boolean;
  environment: 'local' | 'test' | 'production';
}

export function useEnvironment(): EnvironmentInfo {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo>({
    isLocal: environmentUtils.isLocalEnvironment(),
    isTest: environmentUtils.isTestEnvironment(),
    isProduction: environmentUtils.isProductionEnvironment(),
    environment: 'local'
  });

  useEffect(() => {
    // Determine current environment
    let environment: 'local' | 'test' | 'production' = 'local';

    if (environmentUtils.isTestEnvironment()) {
      environment = 'test';
    } else if (environmentUtils.isLocalEnvironment()) {
      environment = 'local';
    } else {
      environment = 'production';
    }

    setEnvInfo({
      isLocal: environmentUtils.isLocalEnvironment(),
      isTest: environmentUtils.isTestEnvironment(),
      isProduction: environmentUtils.isProductionEnvironment(),
      environment
    });
  }, []);

  return envInfo;
}
