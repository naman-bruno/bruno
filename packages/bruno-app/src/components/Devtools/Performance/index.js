import React from 'react';
import { useSelector } from 'react-redux';
import OverviewTab from '../FileSync/OverviewTab';
import StyledWrapper from '../FileSync/StyledWrapper';

const Performance = () => {
  const {
    fileOperations,
    watcherStats,
    parsingErrors,
    activeWatchers,
    systemResources,
  } = useSelector(state => state.fileSync);

  const collections = useSelector(state => state.collections.collections);

  return (
    <StyledWrapper>
      <div className="tab-content">
        <div className="tab-content-area">
          <OverviewTab
            systemResources={systemResources}
            fileOperations={fileOperations}
            watcherStats={watcherStats}
            activeWatchers={activeWatchers}
            parsingErrors={parsingErrors}
            collections={collections}
          />
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Performance;
