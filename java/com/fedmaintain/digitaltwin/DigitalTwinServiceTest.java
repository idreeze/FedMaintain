package com.fedmaintain.digitaltwin;

import com.fedmaintain.alert.repository.MaintenanceAlertRepository;
import com.fedmaintain.digitaltwin.dto.DigitalTwinResponse;
import com.fedmaintain.digitaltwin.dto.DigitalTwinSensorViewDto;
import com.fedmaintain.digitaltwin.dto.DigitalTwinSummaryResponse;
import com.fedmaintain.digitaltwin.entity.*;
import com.fedmaintain.digitaltwin.repository.DigitalTwinRepository;
import com.fedmaintain.digitaltwin.repository.DigitalTwinStateHistoryRepository;
import com.fedmaintain.digitaltwin.repository.DigitalTwinStateRepository;
import com.fedmaintain.digitaltwin.service.DigitalTwinSynchronizationService;
import com.fedmaintain.digitaltwin.service.impl.DigitalTwinServiceImpl;
import com.fedmaintain.machine.entity.Machine;
import com.fedmaintain.machine.repository.MachineRepository;
import com.fedmaintain.ml.repository.RulPredictionRepository;
import com.fedmaintain.sensor.entity.Sensor;
import com.fedmaintain.sensor.entity.SensorHealthState;
import com.fedmaintain.sensor.entity.SensorReading;
import com.fedmaintain.sensor.entity.SensorType;
import com.fedmaintain.sensor.repository.SensorReadingRepository;
import com.fedmaintain.sensor.repository.SensorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DigitalTwinServiceTest {

    @Mock
    private DigitalTwinRepository digitalTwinRepository;
    @Mock
    private DigitalTwinStateRepository stateRepository;
    @Mock
    private DigitalTwinStateHistoryRepository historyRepository;
    @Mock
    private MachineRepository machineRepository;
    @Mock
    private SensorRepository sensorRepository;
    @Mock
    private SensorReadingRepository readingRepository;
    @Mock
    private MaintenanceAlertRepository alertRepository;
    @Mock
    private RulPredictionRepository predictionRepository;
    @Mock
    private DigitalTwinSynchronizationService syncService;

    private DigitalTwinServiceImpl digitalTwinService;

    @BeforeEach
    void setUp() {
        digitalTwinService = new DigitalTwinServiceImpl(
                digitalTwinRepository,
                stateRepository,
                historyRepository,
                machineRepository,
                sensorRepository,
                readingRepository,
                alertRepository,
                predictionRepository,
                syncService
        );
    }

    @Test
    @DisplayName("Should auto-register Digital Twin on machine lookup if none exists")
    void shouldAutoRegisterDigitalTwinOnMachineLookup() {
        Long machineId = 1L;
        Machine machine = Machine.builder()
                .id(machineId)
                .machineCode("CMP-001")
                .name("CMP Polisher 1")
                .build();

        DigitalTwin savedTwin = DigitalTwin.builder()
                .id(10L)
                .twinCode("DT-CMP-001")
                .machine(machine)
                .status(DigitalTwinStatus.ACTIVE)
                .build();

        DigitalTwinState state = DigitalTwinState.builder()
                .id(100L)
                .digitalTwin(savedTwin)
                .machine(machine)
                .operatingState(MachineOperatingState.NORMAL)
                .healthScore(95.0)
                .rulHours(120.0)
                .build();

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(digitalTwinRepository.findByMachineId(machineId)).thenReturn(Optional.empty());
        when(digitalTwinRepository.save(any(DigitalTwin.class))).thenReturn(savedTwin);
        when(stateRepository.findByDigitalTwinId(10L)).thenReturn(Optional.of(state));

        DigitalTwinResponse response = digitalTwinService.getDigitalTwinByMachineId(machineId);

        assertNotNull(response);
        assertEquals("DT-CMP-001", response.getTwinCode());
        assertEquals("CMP-001", response.getMachineCode());
        assertNotNull(response.getCurrentState());
        assertEquals(MachineOperatingState.NORMAL, response.getCurrentState().getOperatingState());

        verify(digitalTwinRepository).save(any(DigitalTwin.class));
    }

    @Test
    @DisplayName("Should get sensor view with trend calculation")
    void shouldGetSensorViewWithTrend() {
        Long twinId = 1L;
        Long machineId = 10L;
        Machine machine = Machine.builder().id(machineId).machineCode("CMP-001").build();
        DigitalTwin twin = DigitalTwin.builder().id(twinId).machine(machine).build();

        Sensor vibSensor = Sensor.builder()
                .id(101L)
                .sensorCode("VIB-001")
                .sensorType(SensorType.VIBRATION)
                .unit("mm/s")
                .healthState(SensorHealthState.NORMAL)
                .build();

        SensorReading reading1 = SensorReading.builder().sensorId(101L).value(2.0).time(Instant.now().minusSeconds(300)).build();
        SensorReading reading2 = SensorReading.builder().sensorId(101L).value(3.5).time(Instant.now()).build();

        when(digitalTwinRepository.findById(twinId)).thenReturn(Optional.of(twin));
        when(sensorRepository.findByMachineId(machineId)).thenReturn(List.of(vibSensor));
        when(readingRepository.findFirstBySensorIdOrderByTimeDesc(101L)).thenReturn(Optional.of(reading2));
        when(readingRepository.findBySensorIdAndTimeBetweenOrderByTimeAsc(eq(101L), any(), any(), any()))
                .thenReturn(List.of(reading1, reading2));

        List<DigitalTwinSensorViewDto> sensors = digitalTwinService.getDigitalTwinSensors(twinId);

        assertNotNull(sensors);
        assertEquals(1, sensors.size());
        DigitalTwinSensorViewDto sDto = sensors.get(0);
        assertEquals("VIB-001", sDto.getSensorCode());
        assertEquals(3.5, sDto.getValue());
        assertEquals(SensorTrend.INCREASING, sDto.getTrend());
    }

    @Test
    @DisplayName("Should return all digital twins summaries")
    void shouldReturnAllDigitalTwins() {
        Machine m1 = Machine.builder().id(1L).machineCode("CMP-001").name("Tool 1").build();
        DigitalTwin dt1 = DigitalTwin.builder().id(10L).twinCode("DT-CMP-001").machine(m1).status(DigitalTwinStatus.ACTIVE).build();
        DigitalTwinState s1 = DigitalTwinState.builder().operatingState(MachineOperatingState.NORMAL).healthScore(90.0).build();

        when(machineRepository.findAll()).thenReturn(List.of(m1));
        when(digitalTwinRepository.findByMachineId(1L)).thenReturn(Optional.of(dt1));
        when(stateRepository.findByDigitalTwinId(10L)).thenReturn(Optional.of(s1));

        List<DigitalTwinSummaryResponse> twins = digitalTwinService.getAllDigitalTwins();

        assertNotNull(twins);
        assertEquals(1, twins.size());
        assertEquals("DT-CMP-001", twins.get(0).getTwinCode());
        assertEquals(MachineOperatingState.NORMAL, twins.get(0).getOperatingState());
    }
}
