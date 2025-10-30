# YOU-N-I-VERSE: Human Design Chart Calculator
# Multi-Zodiac System (Tropical, Sidereal, Draconic, True Sidereal)

"""
COMPLETE HUMAN DESIGN CHART CALCULATOR
Integrates Swiss Ephemeris for accurate planetary positions
Supports 4 zodiac systems with gate mapping
"""

from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum
import math

# Note: In production, you'd use: import swisseph as swe
# For this demo, we'll create a mock ephemeris that shows the structure

class ZodiacSystem(Enum):
    """Zodiac calculation systems"""
    TROPICAL = "tropical"
    SIDEREAL_FAGAN = "sidereal_fagan"  # Fagan-Bradley ayanamsa
    DRACONIC = "draconic"
    TRUE_SIDEREAL = "true_sidereal"  # Lahiri ayanamsa

class Planet(Enum):
    """Planetary bodies for Human Design"""
    SUN = 0
    EARTH = 1  # Opposite of Sun
    MOON = 2
    NORTH_NODE = 3
    SOUTH_NODE = 4
    MERCURY = 5
    VENUS = 6
    MARS = 7
    JUPITER = 8
    SATURN = 9
    URANUS = 10
    NEPTUNE = 11
    PLUTO = 12

@dataclass
class PlanetaryPosition:
    """Planetary position data"""
    planet: str
    longitude: float  # Ecliptic longitude in degrees
    latitude: float   # Ecliptic latitude
    speed: float      # Daily motion
    
    # Detailed position
    sign: str
    degree: float
    minute: float
    second: float
    
    # Gate mapping
    gate: int
    line: int
    color: int
    tone: int
    base: int
    
    # Layer assignment
    layer: str  # "personality" or "design"

@dataclass
class HumanDesignChart:
    """Complete Human Design Chart"""
    birth_datetime: datetime
    location: Dict[str, float]
    zodiac_system: ZodiacSystem
    
    # Planetary positions
    personality_sun: Optional[PlanetaryPosition] = None
    personality_earth: Optional[PlanetaryPosition] = None
    personality_moon: Optional[PlanetaryPosition] = None
    personality_north_node: Optional[PlanetaryPosition] = None
    personality_south_node: Optional[PlanetaryPosition] = None
    personality_mercury: Optional[PlanetaryPosition] = None
    personality_venus: Optional[PlanetaryPosition] = None
    personality_mars: Optional[PlanetaryPosition] = None
    personality_jupiter: Optional[PlanetaryPosition] = None
    personality_saturn: Optional[PlanetaryPosition] = None
    personality_uranus: Optional[PlanetaryPosition] = None
    personality_neptune: Optional[PlanetaryPosition] = None
    personality_pluto: Optional[PlanetaryPosition] = None
    
    design_sun: Optional[PlanetaryPosition] = None
    design_earth: Optional[PlanetaryPosition] = None
    design_moon: Optional[PlanetaryPosition] = None
    design_north_node: Optional[PlanetaryPosition] = None
    design_south_node: Optional[PlanetaryPosition] = None
    design_mercury: Optional[PlanetaryPosition] = None
    design_venus: Optional[PlanetaryPosition] = None
    design_mars: Optional[PlanetaryPosition] = None
    design_jupiter: Optional[PlanetaryPosition] = None
    design_saturn: Optional[PlanetaryPosition] = None
    design_uranus: Optional[PlanetaryPosition] = None
    design_neptune: Optional[PlanetaryPosition] = None
    design_pluto: Optional[PlanetaryPosition] = None
    
    # Calculated properties
    hd_type: str = ""
    authority: str = ""
    profile: str = ""
    definition: str = ""
    incarnation_cross: str = ""
    
    # Layer-specific gates
    mind_gates: List[int] = field(default_factory=list)
    heart_gates: List[int] = field(default_factory=list)
    body_gates: List[int] = field(default_factory=list)

# ===== GATE WHEEL MAPPING =====

class GateWheel:
    """Maps ecliptic degrees to Human Design gates"""
    
    # Human Design gate wheel starting positions (in degrees)
    # Gate 41 starts at 0° Aries in the tropical zodiac
    GATE_ORDER = [
        41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
        27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
        31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
        28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60
    ]
    
    GATE_DEGREE_SIZE = 5.625  # 360° / 64 gates
    LINE_DEGREE_SIZE = 0.9375  # 5.625° / 6 lines
    
    @classmethod
    def degree_to_gate(cls, longitude: float) -> int:
        """Convert ecliptic longitude to gate number"""
        # Normalize to 0-360
        longitude = longitude % 360
        
        # Calculate gate index
        gate_index = int(longitude / cls.GATE_DEGREE_SIZE)
        
        # Return gate number from wheel
        return cls.GATE_ORDER[gate_index]
    
    @classmethod
    def degree_to_line(cls, longitude: float) -> int:
        """Extract line (1-6) from position within gate"""
        longitude = longitude % 360
        position_in_gate = longitude % cls.GATE_DEGREE_SIZE
        line = int(position_in_gate / cls.LINE_DEGREE_SIZE) + 1
        return min(max(line, 1), 6)
    
    @classmethod
    def degree_to_color(cls, longitude: float, latitude: float) -> int:
        """Extract color (1-6) using position and latitude"""
        longitude = longitude % 360
        position_in_line = (longitude % cls.LINE_DEGREE_SIZE)
        color_size = cls.LINE_DEGREE_SIZE / 6
        
        color_base = int(position_in_line / color_size)
        
        # Latitude influence (subtle)
        latitude_mod = int(abs(latitude) / 7.5) % 6
        color = ((color_base + latitude_mod) % 6) + 1
        
        return color
    
    @classmethod
    def arc_minutes_to_tone(cls, arc_minutes: float) -> int:
        """Extract tone (1-6) from arc minutes"""
        tone = int(arc_minutes / 10) + 1
        return min(max(tone, 1), 6)
    
    @classmethod
    def arc_seconds_to_base(cls, arc_seconds: float) -> int:
        """Extract base (1-5) from arc seconds"""
        base = int(arc_seconds / 12) + 1
        return min(max(base, 1), 5)

# ===== ZODIAC CONVERSION =====

class ZodiacConverter:
    """Converts between zodiac systems"""
    
    # Ayanamsa values (as of 2000.0)
    FAGAN_BRADLEY_AYANAMSA = 24.042  # Fagan-Bradley
    LAHIRI_AYANAMSA = 23.851  # Lahiri (True Sidereal)
    
    @classmethod
    def tropical_to_sidereal_fagan(cls, tropical_long: float, julian_day: float) -> float:
        """Convert tropical to sidereal (Fagan-Bradley)"""
        # Ayanamsa increases ~50.3" per year
        years_since_2000 = (julian_day - 2451545.0) / 365.25
        ayanamsa = cls.FAGAN_BRADLEY_AYANAMSA + (years_since_2000 * 0.0139722)
        
        sidereal_long = (tropical_long - ayanamsa) % 360
        return sidereal_long
    
    @classmethod
    def tropical_to_true_sidereal(cls, tropical_long: float, julian_day: float) -> float:
        """Convert tropical to true sidereal (Lahiri)"""
        years_since_2000 = (julian_day - 2451545.0) / 365.25
        ayanamsa = cls.LAHIRI_AYANAMSA + (years_since_2000 * 0.0139722)
        
        sidereal_long = (tropical_long - ayanamsa) % 360
        return sidereal_long
    
    @classmethod
    def tropical_to_draconic(cls, tropical_long: float, north_node_long: float) -> float:
        """Convert tropical to draconic (relative to North Node)"""
        draconic_long = (tropical_long - north_node_long) % 360
        return draconic_long

# ===== MOCK EPHEMERIS (Replace with Swiss Ephemeris in production) =====

class MockEphemeris:
    """
    Mock ephemeris for demonstration
    In production, replace with: import swisseph as swe
    """
    
    @staticmethod
    def datetime_to_julian_day(dt: datetime) -> float:
        """Convert datetime to Julian Day"""
        a = (14 - dt.month) // 12
        y = dt.year + 4800 - a
        m = dt.month + 12 * a - 3
        
        jd = dt.day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045
        jd += (dt.hour - 12) / 24 + dt.minute / 1440 + dt.second / 86400
        
        return jd
    
    @staticmethod
    def calculate_planetary_position(planet: Planet, julian_day: float, 
                                     latitude: float, longitude: float) -> Dict:
        """
        Mock planetary calculation
        In production, use: swe.calc_ut(jd, planet_id)
        """
        # Mock calculation based on julian day
        seed = (julian_day + planet.value * 7.3) % 360
        
        mock_positions = {
            Planet.SUN: (seed * 1.0) % 360,
            Planet.EARTH: (seed * 1.0 + 180) % 360,
            Planet.MOON: (seed * 13.176) % 360,
            Planet.NORTH_NODE: (seed * 0.053) % 360,
            Planet.SOUTH_NODE: (seed * 0.053 + 180) % 360,
            Planet.MERCURY: (seed * 4.09) % 360,
            Planet.VENUS: (seed * 1.6) % 360,
            Planet.MARS: (seed * 0.524) % 360,
            Planet.JUPITER: (seed * 0.083) % 360,
            Planet.SATURN: (seed * 0.034) % 360,
            Planet.URANUS: (seed * 0.012) % 360,
            Planet.NEPTUNE: (seed * 0.006) % 360,
            Planet.PLUTO: (seed * 0.004) % 360,
        }
        
        long = mock_positions.get(planet, 0.0)
        
        return {
            "longitude": long,
            "latitude": (seed * 0.13) % 10 - 5,  # Mock latitude
            "speed": 1.0,  # Mock speed
            "distance": 1.0
        }

# ===== HUMAN DESIGN CALCULATOR =====

class HumanDesignCalculator:
    """
    Complete Human Design chart calculator
    Supports multiple zodiac systems
    """
    
    def __init__(self):
        self.gate_wheel = GateWheel()
        self.zodiac_converter = ZodiacConverter()
        self.ephemeris = MockEphemeris()
    
    def calculate_chart(self, birth_datetime: datetime, latitude: float, 
                       longitude: float, zodiac_system: ZodiacSystem) -> HumanDesignChart:
        """
        Calculate complete Human Design chart
        
        Args:
            birth_datetime: Birth date and time
            latitude: Birth location latitude
            longitude: Birth location longitude
            zodiac_system: Zodiac system to use
            
        Returns:
            Complete HumanDesignChart
        """
        
        # Convert to Julian Day
        jd = self.ephemeris.datetime_to_julian_day(birth_datetime)
        
        # Calculate design time (88 degrees of Sun travel before birth ≈ 88 days)
        design_jd = jd - 88.0
        
        # Calculate all planetary positions
        chart = HumanDesignChart(
            birth_datetime=birth_datetime,
            location={"latitude": latitude, "longitude": longitude},
            zodiac_system=zodiac_system
        )
        
        # Calculate personality (birth time) positions
        for planet in Planet:
            position = self._calculate_planet_position(
                planet, jd, latitude, longitude, zodiac_system, "personality"
            )
            self._set_chart_planet(chart, planet.name.lower(), position, "personality")
        
        # Calculate design (88 days before birth) positions
        for planet in Planet:
            position = self._calculate_planet_position(
                planet, design_jd, latitude, longitude, zodiac_system, "design"
            )
            self._set_chart_planet(chart, planet.name.lower(), position, "design")
        
        # Extract layer-specific gates
        chart.mind_gates = self._extract_mind_gates(chart)
        chart.heart_gates = self._extract_heart_gates(chart)
        chart.body_gates = self._extract_body_gates(chart)
        
        # Calculate chart properties
        chart.hd_type = self._determine_type(chart)
        chart.authority = self._determine_authority(chart)
        chart.profile = self._determine_profile(chart)
        
        return chart
    
    def _calculate_planet_position(self, planet: Planet, julian_day: float,
                                   latitude: float, longitude: float,
                                   zodiac_system: ZodiacSystem, 
                                   layer: str) -> PlanetaryPosition:
        """Calculate position for a single planet"""
        
        # Get tropical position from ephemeris
        eph_data = self.ephemeris.calculate_planetary_position(
            planet, julian_day, latitude, longitude
        )
        
        tropical_long = eph_data["longitude"]
        
        # Convert to requested zodiac system
        if zodiac_system == ZodiacSystem.TROPICAL:
            final_long = tropical_long
        elif zodiac_system == ZodiacSystem.SIDEREAL_FAGAN:
            final_long = self.zodiac_converter.tropical_to_sidereal_fagan(
                tropical_long, julian_day
            )
        elif zodiac_system == ZodiacSystem.TRUE_SIDEREAL:
            final_long = self.zodiac_converter.tropical_to_true_sidereal(
                tropical_long, julian_day
            )
        elif zodiac_system == ZodiacSystem.DRACONIC:
            # Need North Node position for draconic
            nn_data = self.ephemeris.calculate_planetary_position(
                Planet.NORTH_NODE, julian_day, latitude, longitude
            )
            final_long = self.zodiac_converter.tropical_to_draconic(
                tropical_long, nn_data["longitude"]
            )
        else:
            final_long = tropical_long
        
        # Extract degree, minute, second
        degree = int(final_long)
        minute = (final_long - degree) * 60
        second = (minute - int(minute)) * 60
        
        # Convert to gate structure
        gate = self.gate_wheel.degree_to_gate(final_long)
        line = self.gate_wheel.degree_to_line(final_long)
        color = self.gate_wheel.degree_to_color(final_long, eph_data["latitude"])
        tone = self.gate_wheel.arc_minutes_to_tone(minute)
        base = self.gate_wheel.arc_seconds_to_base(second)
        
        # Determine zodiac sign
        sign = self._degree_to_sign(final_long)
        
        return PlanetaryPosition(
            planet=planet.name,
            longitude=final_long,
            latitude=eph_data["latitude"],
            speed=eph_data["speed"],
            sign=sign,
            degree=final_long % 30,  # Degree within sign
            minute=minute,
            second=second,
            gate=gate,
            line=line,
            color=color,
            tone=tone,
            base=base,
            layer=layer
        )
    
    def _set_chart_planet(self, chart: HumanDesignChart, planet_name: str, 
                         position: PlanetaryPosition, layer: str):
        """Set planet position in chart"""
        attr_name = f"{layer}_{planet_name}"
        setattr(chart, attr_name, position)
    
    def _degree_to_sign(self, longitude: float) -> str:
        """Convert degree to zodiac sign"""
        signs = [
            "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
            "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
        ]
        sign_index = int(longitude / 30)
        return signs[sign_index % 12]
    
    def _extract_mind_gates(self, chart: HumanDesignChart) -> List[int]:
        """Extract gates relevant to Mind (Head + Ajna centers)"""
        # Head center gates: 64, 61, 63
        # Ajna center gates: 47, 24, 4, 17, 43, 11
        mind_center_gates = [64, 61, 63, 47, 24, 4, 17, 43, 11]
        
        chart_gates = []
        for attr_name in dir(chart):
            if attr_name.startswith('personality_') or attr_name.startswith('design_'):
                planet_pos = getattr(chart, attr_name)
                if planet_pos and planet_pos.gate in mind_center_gates:
                    chart_gates.append(planet_pos.gate)
        
        return list(set(chart_gates))  # Unique gates only
    
    def _extract_heart_gates(self, chart: HumanDesignChart) -> List[int]:
        """Extract gates relevant to Heart (G Center + Heart/Ego)"""
        # G Center gates: 1, 13, 7, 2, 15, 46, 25, 10
        # Heart/Ego gates: 21, 40, 26, 51
        heart_center_gates = [1, 13, 7, 2, 15, 46, 25, 10, 21, 40, 26, 51]
        
        chart_gates = []
        for attr_name in dir(chart):
            if attr_name.startswith('personality_') or attr_name.startswith('design_'):
                planet_pos = getattr(chart, attr_name)
                if planet_pos and planet_pos.gate in heart_center_gates:
                    chart_gates.append(planet_pos.gate)
        
        return list(set(chart_gates))
    
    def _extract_body_gates(self, chart: HumanDesignChart) -> List[int]:
        """Extract all gates for full body chart"""
        chart_gates = []
        for attr_name in dir(chart):
            if attr_name.startswith('personality_') or attr_name.startswith('design_'):
                planet_pos = getattr(chart, attr_name)
                if planet_pos:
                    chart_gates.append(planet_pos.gate)
        
        return list(set(chart_gates))
    
    def _determine_type(self, chart: HumanDesignChart) -> str:
        """Determine Human Design type (simplified)"""
        # This would use proper center definition logic
        # For now, return mock value
        return "Generator"
    
    def _determine_authority(self, chart: HumanDesignChart) -> str:
        """Determine authority (simplified)"""
        return "Sacral Authority"
    
    def _determine_profile(self, chart: HumanDesignChart) -> str:
        """Determine profile from Sun/Earth lines"""
        if chart.personality_sun and chart.design_sun:
            personality_line = chart.personality_sun.line
            design_line = chart.design_sun.line
            return f"{personality_line}/{design_line}"
        return "Unknown"

# ===== CHART EXPORT FOR VISUALIZATION =====

class ChartExporter:
    """Export chart data for visualization"""
    
    @staticmethod
    def export_for_wheel_view(chart: HumanDesignChart) -> Dict:
        """Export chart in format for wheel visualization"""
        
        planets_data = []
        
        # Collect all planetary positions
        for attr_name in dir(chart):
            if attr_name.startswith('personality_') or attr_name.startswith('design_'):
                planet_pos = getattr(chart, attr_name)
                if planet_pos:
                    planets_data.append({
                        "planet": planet_pos.planet,
                        "layer": planet_pos.layer,
                        "longitude": planet_pos.longitude,
                        "gate": planet_pos.gate,
                        "line": planet_pos.line,
                        "sign": planet_pos.sign,
                        "degree": planet_pos.degree
                    })
        
        return {
            "zodiac_system": chart.zodiac_system.value,
            "planets": planets_data,
            "mind_gates": chart.mind_gates,
            "heart_gates": chart.heart_gates,
            "body_gates": chart.body_gates,
            "type": chart.hd_type,
            "authority": chart.authority,
            "profile": chart.profile
        }
    
    @staticmethod
    def export_layer_specific(chart: HumanDesignChart, layer: str) -> Dict:
        """Export specific layer (mind/heart/body) data"""
        
        if layer == "mind":
            gates = chart.mind_gates
        elif layer == "heart":
            gates = chart.heart_gates
        else:
            gates = chart.body_gates
        
        # Find planets activating these gates
        activating_planets = []
        for attr_name in dir(chart):
            if attr_name.startswith('personality_') or attr_name.startswith('design_'):
                planet_pos = getattr(chart, attr_name)
                if planet_pos and planet_pos.gate in gates:
                    activating_planets.append({
                        "planet": planet_pos.planet,
                        "gate": planet_pos.gate,
                        "line": planet_pos.line,
                        "longitude": planet_pos.longitude
                    })
        
        return {
            "layer": layer,
    
