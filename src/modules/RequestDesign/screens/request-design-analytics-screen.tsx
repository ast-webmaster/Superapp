import { useState } from 'react';
import { View } from 'react-native';

import { EmptyState, Screen } from '@/shared/ui';

import { DesignerCard, SectionTitle, TrendCard } from '../components/analytics/analytics-sections';
import { MonthStepper } from '../components/analytics/month-stepper';
import { currentPeriod } from '../components/analytics/period';
import { QueryView } from '../components/analytics/query-view';
import { useRequestDesignAnalytics } from '../hooks/use-analytics';
import type { AnalyticsPeriod } from '../types';

/**
 * How many points each designer completed in a month, against the monthly target, and the trend
 * of the last three months. A designer sees only themselves; the server decides who sees everyone.
 */
export function RequestDesignAnalyticsScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(() => currentPeriod());
  const query = useRequestDesignAnalytics(period);

  return (
    <Screen>
      <MonthStepper value={period} onChange={setPeriod} />
      <QueryView query={query}>
        {(data) =>
          data.designers.length === 0 ? (
            <EmptyState
              icon="chart"
              title="Nothing completed this month"
              description="Points appear once a request is approved."
            />
          ) : (
            <View className="gap-4">
              <SectionTitle title="Target" note="Points of completed requests this month." />
              {data.designers.map((designer) => (
                <DesignerCard key={designer.email} designer={designer} />
              ))}
              {data.trend.series.length > 0 ? (
                <>
                  <SectionTitle title="Trend" note="Points in the last three months." />
                  {data.trend.series.map((series) => (
                    <TrendCard
                      key={series.email}
                      series={series}
                      months={data.trend.months}
                      max={Math.max(0, ...data.trend.series.flatMap((s) => s.data))}
                    />
                  ))}
                </>
              ) : null}
            </View>
          )
        }
      </QueryView>
    </Screen>
  );
}
