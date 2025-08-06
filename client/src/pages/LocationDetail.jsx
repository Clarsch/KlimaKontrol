import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import TopBar from '../components/TopBar';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import { withRetry } from '../utils/apiHelpers';
import { showSuccess } from '../components/SuccessMessage';
import PropTypes from 'prop-types';
import axiosInstance from '../api/axiosConfig';
import { useTranslation } from 'react-i18next';
import { formatTimestamp } from '../utils/formatters';
import GraphComponent from '../components/GraphComponent';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 80px;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateY(${props => props.$visible ? '0' : '20px'});
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

const Content = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
`;

const MainSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SideSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const WarningCard = styled(Card)`
  border-left: 4px solid ${props => props.$active ? '#FF0000' : '#00FF00'};
  margin-bottom: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const WarningHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WarningType = styled.span`
  font-weight: bold;
  color: ${props => props.$active ? '#FF0000' : '#008000'};
`;

const WarningTimestamp = styled.span`
  color: #666;
  font-size: 0.9em;
`;

const WarningMessage = styled.p`
  color: black;
  margin: 0;
`;

const DeactivateButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #FF0000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;

  &:hover {
    background-color: #CC0000;
  }
`;

const Title = styled.h2`
  color: #005670;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const SubTitle = styled.h3`
  color: #005670;
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const ThresholdGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const ThresholdRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const ThresholdLabel = styled.span`
  color: #005670;
  min-width: 120px;
`;

const ThresholdInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100px;
`;

const SaveButton = styled.button`
  background-color: #005670;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background-color: #004560;
  }
`;

const TimeRangeSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TimeButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.$active ? '#005670' : '#f0f0f0'};
  color: ${props => props.$active ? 'white' : '#005670'};

  &:hover {
    background-color: ${props => props.$active ? '#004560' : '#e0e0e0'};
  }
`;

const GraphCard = styled(Card)`
  height: 400px;
  margin-bottom: 1rem;
  padding: 1rem 0.5rem 2.5rem 0.5rem;
  overflow: hidden;
`;

const GraphTitle = styled.h4`
  color: #005670;
  margin-bottom: 1rem;
  font-size: 1rem;
`;

const SettingsCard = styled(Card)`
  margin-bottom: 2rem;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const SettingLabel = styled.span`
  color: #005670;
  min-width: 150px;
`;

const SettingInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100px;
`;

const DeactivationInfo = styled.div`
  color: #666;
  font-size: 0.9em;
  font-style: italic;
  margin-top: 0.5rem;
`;











const WarningsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const DeactivateAllButton = styled.button`
  background-color: #FF0000;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: #CC0000;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const WarningsOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
`;

const ConfirmationModal = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 450px;
  width: 90%;
  position: relative;
`;

const ModalTitle = styled.h3`
  color: #005670;
  margin: 0;
  font-size: 1.2rem;
`;

const ModalText = styled.p`
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const CancelButton = styled.button`
  background-color: #ccc;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #999;
  }
`;

const ConfirmButton = styled(DeactivateAllButton)`
  margin: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const ModalWrapper = styled.div`
  position: fixed;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
`;

const LocationDetail = () => {
  const { t } = useTranslation();
  const { locationId } = useParams();
  const [locationData, setLocationData] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1month');
  const [thresholds, setThresholds] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [isEntering, setIsEntering] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [visible, setVisible] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState({
    settings: null,
    thresholds: null
  });
  const [unsavedThresholds, setUnsavedThresholds] = useState(null);
  const [unsavedSettings, setUnsavedSettings] = useState(null);
  const [isDeactivatingAll, setIsDeactivatingAll] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    setIsEntering(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [locationResponse, environmentalResponse, warningsResponse] = await Promise.all([
          axiosInstance.get(`/api/data/location/${encodeURIComponent(locationId)}`),
          axiosInstance.get(`/api/data/environmental/${encodeURIComponent(locationId)}`, {
            params: { timeRange }
          }),
          axiosInstance.get(`/api/data/warnings/${encodeURIComponent(locationId)}`)
            .catch(error => {
              console.warn('No warnings found:', error);
              return { data: [] }; // Return empty array if warnings endpoint fails
            })
        ]);

        setLocationData(locationResponse.data);
        setEnvironmentalData(environmentalResponse.data);
        setWarnings(warningsResponse.data);
        setThresholds(locationResponse.data.thresholds);
        setSettings(locationResponse.data.settings);
      } catch (err) {
        setError(err.response?.data?.error || 'Error fetching data');
        console.error('Error fetching location data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId, timeRange]);

  useEffect(() => {
    // Fade in on mount
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);




  const handleThresholdChange = (sensor, bound, value) => {
    const newValue = parseFloat(value);
    setUnsavedThresholds(prev => ({
      ...prev || thresholds,
      [sensor]: {
        ...(prev || thresholds)[sensor],
        [bound]: newValue
      }
    }));
  };

  const handleSaveThresholds = async () => {
    if (!unsavedThresholds) return;

    try {
      await withRetry(
        async () => {
          const response = await axiosInstance.put(
            `/api/data/location/${locationId}/thresholds`,
            unsavedThresholds  // Send just the thresholds object
          );
          return response;
        },
        3,
        (attempt, max, delay) => {
          console.log(`Retrying threshold update (${attempt}/${max}) in ${delay}ms`);
        }
      );
      setThresholds(unsavedThresholds);
      setUnsavedThresholds(null);
      showSuccess(t('thresholds_updated_successfully_msg'));
    } catch (error) {
      console.error('Failed to update thresholds:', error);
      setError(t('thresholds_update_failed_msg'));
    }
  };

  const handleSettingChange = (setting, value) => {
    const newValue = parseFloat(value);
    setUnsavedSettings(prev => ({
      ...prev || settings,
      [setting]: newValue
    }));
  };

  const handleSaveSettings = async () => {
    if (!unsavedSettings) return;

    try {
      setIsSavingSettings(true);
      await withRetry(
        async () => {
          console.log('Sending settings update:', {
            settings: {
              groundTemperature: parseFloat(unsavedSettings.groundTemperature)
            }
          });
          
          const response = await axiosInstance.put(
            `/api/data/location/${locationId}/settings`,
            {
              settings: {
                groundTemperature: parseFloat(unsavedSettings.groundTemperature)
              }
            }
          );
          return response;
        },
        3,
        (attempt, max, delay) => {
          console.log(`Retrying settings update (${attempt}/${max}) in ${delay}ms`);
        }
      );
      
      setSettings(unsavedSettings);
      setUnsavedSettings(null);
      showSuccess(t('settings_updated_successfully_msg'));
    } catch (error) {
      console.error('Failed to update settings:', error.response?.data || error);
      setError(error.response?.data?.error || t('settings_update_failed_msg'));
    } finally {
      setIsSavingSettings(false);
    }
  };



  const handleDeactivateWarning = async (warningId) => {
    try {
      const userId = localStorage.getItem('userId');
      await axiosInstance.patch(`/api/data/warnings/${warningId}/deactivate`, {
        userId
      });
      setWarnings(warnings.map(warning => 
        warning.id === warningId 
          ? { 
              ...warning, 
              active: false,
              deactivatedBy: userId,
              deactivatedAt: new Date()
          }
          : warning
      ));
    } catch (error) {
      console.error('Error deactivating warning:', error);
    }
  };

  const handleDeactivateAllWarnings = async () => {
    try {
      setIsDeactivatingAll(true);
      const activeWarnings = sortedWarnings.filter(w => w.active);
      const userId = localStorage.getItem('userId');

      // Deactivate each warning sequentially
      for (const warning of activeWarnings) {
        await axiosInstance.patch(`/api/data/warnings/${warning.id}/deactivate`, {
          userId
        });
      }

      // Update local state
      setWarnings(warnings.map(warning => ({
        ...warning,
        active: false,
        deactivatedBy: userId,
        deactivatedAt: new Date().toISOString()
      })));

      showSuccess(t('all_warnings_deactivated_msg'));
    } catch (error) {
      console.error('Error deactivating all warnings:', error);
    } finally {
      setIsDeactivatingAll(false);
      setShowConfirmation(false);
    }
  };

  const sortedWarnings = useMemo(() => {
    //return [...warnings].sort((a, b) => {
    return [...warnings].filter(w => w.active).sort((a, b) => {
      // Sort by active status first (active/red warnings first)
      if (a.active !== b.active) {
        return b.active ? 1 : -1;
      }
      // Then sort by timestamp (newest first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [warnings]);

  if (loading || !thresholds || !settings) return <LoadingState message={t('loading_location_data')+"..."} />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <PageContainer $visible={visible}>
      <TopBar locationName={locationData?.name || t('loading')+'...'} />
      <Content>
        <MainSection>
          <Card>
            <Title>{t('environmental_data_title')}</Title>
            <TimeRangeSelector>
              <TimeButton 
                $active={timeRange === '1day'} 
                onClick={() => setTimeRange('1day')}
              >
                {t('1_day')}
              </TimeButton>
              <TimeButton 
                $active={timeRange === '1month'} 
                onClick={() => setTimeRange('1month')}
              >
                {t('1_month')}
              </TimeButton>
              <TimeButton 
                $active={timeRange === '6months'} 
                onClick={() => setTimeRange('6months')}
              >
                {t('6_months')}
              </TimeButton>
              <TimeButton 
                $active={timeRange === '1year'} 
                onClick={() => setTimeRange('1year')}
              >
                {t('1_year')}
              </TimeButton>
              <TimeButton 
                $active={timeRange === '2year'} 
                onClick={() => setTimeRange('2year')}
              >
                {t('2_years')}
              </TimeButton>
            </TimeRangeSelector>

            <GraphCard>
              <GraphTitle>{locationData?.name} - {t('combined_data')}</GraphTitle>
              {environmentalData && (
                <GraphComponent
                  data={environmentalData}
                  dataKey="temperature"
                  unit="°C"
                  thresholds={thresholds.temperature}
                  groundTemp={settings.groundTemperature}
                  timeRange={timeRange}
                  locationName={locationData?.name}
                  graphType="combined"
                  height="100%"
                  showSensorLabels={true}
                />
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>{locationData?.name} - {t('temperature')} (°C)</GraphTitle>
              {environmentalData && (
                <GraphComponent
                  data={environmentalData}
                  dataKey="temperature"
                  unit="°C"
                  thresholds={thresholds.temperature}
                  groundTemp={settings.groundTemperature}
                  timeRange={timeRange}
                  locationName={locationData?.name}
                  graphType="single"
                  height="100%"
                  showSensorLabels={true}
                />
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>{locationData?.name} - {t('relative_humidity')} (%)</GraphTitle>
              {environmentalData && (
                <GraphComponent
                  data={environmentalData}
                  dataKey="relative_humidity"
                  unit="%"
                  thresholds={thresholds.humidity}
                  timeRange={timeRange}
                  locationName={locationData?.name}
                  graphType="single"
                  height="100%"
                  showSensorLabels={true}
                />
              )}
            </GraphCard>

            <GraphCard>
              <GraphTitle>{locationData?.name} - {t('air_pressure')} (hPa)</GraphTitle>
              {environmentalData && (
                <GraphComponent
                  data={environmentalData}
                  dataKey="air_pressure"
                  unit="hPa"
                  thresholds={thresholds.pressure}
                  timeRange={timeRange}
                  locationName={locationData?.name}
                  graphType="single"
                  height="100%"
                  showSensorLabels={true}
                />
              )}
            </GraphCard>
          </Card>

          <Card>
            <WarningsHeader>
              <Title>{t('warnings_for', {locationName: locationData?.name})}</Title>
              {sortedWarnings.filter(w => w.active).length > 1 && (
                <DeactivateAllButton 
                  onClick={() => setShowConfirmation(true)}
                  disabled={isDeactivatingAll}
                >
                  {t('deactivate_all_warnings')}
                </DeactivateAllButton>
              )}
            </WarningsHeader>
            <div style={{ position: 'relative' }}>
              {isDeactivatingAll && (
                <WarningsOverlay>
                  <LoadingState message= {t('deactivating_warnings')+"..."} />
                </WarningsOverlay>
              )}
              {sortedWarnings.length === 0 ? (
                <p>{t('no_warnings')}</p>
              ) : (
                sortedWarnings.map((warning) => (
                  <WarningCard key={warning.id} $active={warning.active}>
                    <WarningHeader>
                      <WarningType $active={warning.active}>{warning.type}</WarningType>
                      <WarningTimestamp>
                        {formatTimestamp(warning.timestamp) } 
                      </WarningTimestamp>
                    </WarningHeader>
                    <WarningMessage>{warning.message}</WarningMessage>
                    {!warning.active && warning.deactivatedBy && (
                      <DeactivationInfo>
                        { t( deactivated_by, {
                          userName: warning.deactivatedBy, 
                          dateTimeDeactivated: formatTimestamp(warning.timestamp) 
                        })}
                      </DeactivationInfo>
                    )}
                    {warning.active && (
                      <DeactivateButton onClick={() => handleDeactivateWarning(warning.id)}>
                        {t('deactivate')}
                      </DeactivateButton>
                    )}
                  </WarningCard>
                ))
              )}
            </div>

            {showConfirmation && (
              <>
                <ModalOverlay onClick={() => setShowConfirmation(false)} />
                <ModalWrapper
                  style={{
                    top: `${window.scrollY + (window.innerHeight / 2)}px`
                  }}
                >
                  <ConfirmationModal>
                    <ModalTitle>{t('deactivate_all_warnings')}</ModalTitle>
                    <ModalText>
                      {t('deactivate_all_warning_msg', {locationName: locationData?.name})}
                    </ModalText>
                    <ModalButtons>
                      <CancelButton onClick={() => setShowConfirmation(false)}>
                        {t('cancel')}
                      </CancelButton>
                      <ConfirmButton onClick={handleDeactivateAllWarnings}>
                        {t('deactivate_all')}
                      </ConfirmButton>
                    </ModalButtons>
                  </ConfirmationModal>
                </ModalWrapper>
              </>
            )}
          </Card>
        </MainSection>

        <SideSection>
          <SettingsCard>
          <Title>{t('settings_for', {locationName: locationData?.name})}</Title>
            <SettingRow>
              <SettingLabel>{t('ground_temperature_title')}:</SettingLabel>
              <SettingInput
                type="number"
                value={(unsavedSettings || settings).groundTemperature}
                onChange={(e) => handleSettingChange('groundTemperature', e.target.value)}
              />
            </SettingRow>
            <SaveButton 
              onClick={handleSaveSettings}
              disabled={isSavingSettings || !unsavedSettings}
            >
              {isSavingSettings ? t('saving')+'...' : t('save_settings')}
            </SaveButton>
          </SettingsCard>

          <Card>
            <Title>{t('thresholds_title')}</Title>
            <ThresholdGroup>
              <SubTitle>{t('temperature')} (°C)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>{t('maximum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).temperature.max}
                  onChange={(e) => handleThresholdChange('temperature', 'max', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>{t('minimum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).temperature.min}
                  onChange={(e) => handleThresholdChange('temperature', 'min', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <ThresholdGroup>
              <SubTitle>{t('relative_humidity')} (%)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>{t('maximum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).humidity.max}
                  onChange={(e) => handleThresholdChange('humidity', 'max', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>{t('minimum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).humidity.min}
                  onChange={(e) => handleThresholdChange('humidity', 'min', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <ThresholdGroup>
              <SubTitle>{t('air_pressure')} (hPa)</SubTitle>
              <ThresholdRow>
                <ThresholdLabel>{t('maximum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).pressure.max}
                  onChange={(e) => handleThresholdChange('pressure', 'max', e.target.value)}
                />
              </ThresholdRow>
              <ThresholdRow>
                <ThresholdLabel>{t('minimum')}:</ThresholdLabel>
                <ThresholdInput
                  type="number"
                  value={(unsavedThresholds || thresholds).pressure.min}
                  onChange={(e) => handleThresholdChange('pressure', 'min', e.target.value)}
                />
              </ThresholdRow>
            </ThresholdGroup>

            <SaveButton 
              onClick={handleSaveThresholds}
              disabled={!unsavedThresholds}
            >
              {t('save_thresholds')}
            </SaveButton>
          </Card>
        </SideSection>
      </Content>
    </PageContainer>
  );
};

export default LocationDetail; 