/**
 * Comprehensive Furniture Industry Vocabulary System
 * 
 * This module provides standardized terminology used by enterprise furniture companies
 * to ensure AI-generated prompts use professional, accurate language that meets
 * commercial furniture photography standards.
 */

// Furniture Categories with Technical Classifications
export const FURNITURE_CATEGORIES = {
  // Office Furniture
  OFFICE: {
    SEATING: [
      'executive_chair', 'task_chair', 'conference_chair', 'guest_chair', 'drafting_stool',
      'ergonomic_office_chair', 'mesh_back_chair', 'leather_executive_chair', 'swivel_chair',
      'operator_chair', 'side_chair', 'stacking_chair', 'visitor_chair'
    ],
    DESKING: [
      'executive_desk', 'sit_stand_desk', 'corner_desk', 'reception_desk', 'workstation',
      'height_adjustable_desk', 'conference_table', 'meeting_table', 'collaborative_table',
      'standing_desk', 'l_shaped_desk', 'u_shaped_desk', 'modular_desk_system'
    ],
    STORAGE: [
      'filing_cabinet', 'bookcase', 'shelving_unit', 'credenza', 'storage_tower',
      'lateral_file', 'vertical_file', 'mobile_pedestal', 'overhead_storage',
      'modular_storage_system', 'display_cabinet', 'wardrobe'
    ],
    ACCESSORIES: [
      'desk_lamp', 'monitor_arm', 'keyboard_tray', 'footrest', 'document_holder',
      'privacy_screen', 'power_module', 'cable_management', 'desk_pad', 'pen_holder'
    ]
  },
  
  // Residential Furniture
  RESIDENTIAL: {
    SEATING: [
      'dining_chair', 'lounge_chair', 'accent_chair', 'recliner', 'sectional_sofa',
      'loveseat', 'ottoman', 'bench', 'bar_stool', 'counter_stool', 'armchair',
      'wingback_chair', 'chaise_lounge', 'rocking_chair', 'swivel_chair'
    ],
    TABLES: [
      'dining_table', 'coffee_table', 'side_table', 'console_table', 'end_table',
      'nesting_tables', 'accent_table', 'bar_table', 'bistro_table', 'pedestal_table',
      'trestle_table', 'extension_table', 'drop_leaf_table'
    ],
    STORAGE: [
      'dresser', 'chest_of_drawers', 'armoire', 'entertainment_center', 'bookshelf',
      'display_cabinet', 'china_cabinet', 'sideboard', 'buffet', 'hall_tree',
      'shoe_cabinet', 'linen_cabinet'
    ],
    BEDROOM: [
      'bed_frame', 'headboard', 'nightstand', 'bedside_table', 'bench',
      'vanity', 'mirror', 'chest', 'wardrobe', 'dresser_with_mirror'
    ]
  },

  // Healthcare & Medical Furniture
  HEALTHCARE: {
    SEATING: [
      'medical_exam_chair', 'patient_waiting_chair', 'physician_stool_adjustable', 'rehabilitation_chair',
      'bariatric_chair_reinforced', 'antimicrobial_seating', 'blood_draw_chair', 'dialysis_chair_recline'
    ],
    TABLES: [
      'medical_exam_table', 'overbed_table_adjustable', 'instrument_table_stainless', 'phlebotomy_table',
      'treatment_table_electric_height', 'tilt_table_physical_therapy', 'mayo_stand_mobile'
    ],
    STORAGE: [
      'medical_cabinet_locked', 'instrument_storage_sterile', 'supply_cart_mobile', 'pharmacy_shelving',
      'specimen_refrigerator_medical', 'controlled_substance_safe', 'biohazard_storage_cabinet'
    ],
    SPECIALIZED: [
      'stretcher_transport', 'wheelchair_standard_institutional', 'hospital_bed_electric', 'iv_pole_adjustable',
      'isolation_room_furniture', 'pediatric_furniture_colorful', 'geriatric_furniture_supportive'
    ]
  },

  // Educational Furniture
  EDUCATION: {
    SEATING: [
      'student_desk_chair', 'lecture_hall_seating', 'library_study_chair', 'cafeteria_bench_seating',
      'classroom_stack_chair', 'computer_lab_chair_ergonomic', 'auditorium_seat_fixed', 'bean_bag_reading_area'
    ],
    TABLES: [
      'student_desk_adjustable_height', 'collaboration_table_hexagonal', 'library_study_table', 'science_lab_table_phenolic',
      'computer_workstation_dual_monitor', 'art_table_tilt_top', 'cafeteria_table_folding', 'whiteboard_table_mobile'
    ],
    STORAGE: [
      'classroom_storage_cubbies', 'library_shelving_steel', 'art_supply_cabinet', 'textbook_storage_mobile',
      'student_locker_ventilated', 'teacher_desk_locking_drawers', 'equipment_storage_secure'
    ],
    SPECIALIZED: [
      'interactive_whiteboard_mount', 'projector_cart_mobile', 'charging_station_laptops', 'presentation_podium',
      'music_stand_adjustable', 'easel_art_class', 'gymnasium_storage_wall_mounted'
    ]
  },

  // Hospitality Furniture
  HOSPITALITY: {
    SEATING: [
      'hotel_lobby_chair_commercial_grade', 'restaurant_booth_seating', 'bar_stool_swivel_adjustable', 'lounge_chair_hospitality',
      'dining_chair_stackable_commercial', 'conference_room_chair_executive', 'outdoor_patio_chair_weather_resistant'
    ],
    TABLES: [
      'restaurant_table_laminate_top', 'hotel_room_desk_compact', 'conference_table_boat_shaped', 'cocktail_table_high_top',
      'buffet_table_folding_commercial', 'outdoor_dining_table_aluminum', 'coffee_table_lobby_oversized'
    ],
    CASEGOODS: [
      'hotel_dresser_built_in', 'restaurant_server_station', 'lobby_reception_desk', 'mini_fridge_cabinet_hotel',
      'safe_cabinet_in_room', 'luggage_rack_folding', 'closet_system_hotel_room'
    ]
  }
} as const;

// Material Classifications with Technical Descriptions
export const FURNITURE_MATERIALS = {
  WOOD: {
    HARDWOOD: [
      'solid_oak', 'solid_walnut', 'solid_maple', 'solid_cherry', 'solid_ash',
      'solid_mahogany', 'solid_teak', 'solid_birch', 'solid_beech', 'solid_hickory'
    ],
    ENGINEERED: [
      'oak_veneer', 'walnut_veneer', 'maple_veneer', 'cherry_veneer',
      'laminate_surface', 'melamine_finish', 'thermofoil', 'high_pressure_laminate'
    ],
    FINISHES: [
      'natural_oil_finish', 'polyurethane_coating', 'lacquer_finish', 'wax_finish',
      'stained_finish', 'painted_finish', 'distressed_finish', 'hand_rubbed_finish'
    ]
  },
  
  METAL: {
    STEEL: [
      'powder_coated_steel', 'brushed_steel', 'polished_steel', 'galvanized_steel',
      'cold_rolled_steel', 'stainless_steel', 'carbon_steel'
    ],
    ALUMINUM: [
      'anodized_aluminum', 'brushed_aluminum', 'polished_aluminum', 'powder_coated_aluminum',
      'extruded_aluminum', 'cast_aluminum'
    ],
    OTHER_METALS: [
      'brass_hardware', 'bronze_hardware', 'copper_accents', 'zinc_alloy',
      'chrome_plating', 'nickel_plating'
    ]
  },
  
  UPHOLSTERY: {
    LEATHER: [
      'full_grain_leather', 'top_grain_leather', 'corrected_grain_leather',
      'bonded_leather', 'faux_leather', 'aniline_leather', 'semi_aniline_leather'
    ],
    FABRIC: [
      'performance_fabric', 'contract_grade_fabric', 'wool_upholstery',
      'linen_blend', 'cotton_blend', 'polyester_blend', 'microfiber',
      'vinyl_upholstery', 'mesh_fabric'
    ],
    FOAM: [
      'high_density_foam', 'memory_foam', 'polyurethane_foam', 'latex_foam',
      'down_alternative', 'fiber_fill', 'spring_system', 'webbing_support'
    ]
  },
  
  HARDWARE: {
    MECHANISMS: [
      'soft_close_hinges', 'full_extension_drawer_slides', 'ball_bearing_slides',
      'undermount_slides', 'pneumatic_lift', 'tilt_mechanism', 'swivel_base',
      'locking_mechanism', 'height_adjustment_mechanism'
    ],
    CONNECTORS: [
      'cam_lock_fasteners', 'threaded_inserts', 'dowel_pins', 'screws_and_bolts',
      'bracket_connections', 'mortise_and_tenon', 'dovetail_joints'
    ]
  }
} as const;

// Style Classifications for Design Context
export const FURNITURE_STYLES = {
  CONTEMPORARY: [
    'modern_minimalist', 'scandinavian', 'mid_century_modern', 'contemporary_classic',
    'bauhaus_inspired', 'streamlined_modern', 'geometric_modern'
  ],
  TRADITIONAL: [
    'traditional_classic', 'shaker_style', 'craftsman_style', 'colonial',
    'georgian', 'victorian', 'english_country', 'french_provincial'
  ],
  TRANSITIONAL: [
    'modern_transitional', 'classic_transitional', 'contemporary_traditional',
    'updated_traditional', 'soft_contemporary'
  ],
  INDUSTRIAL: [
    'industrial_chic', 'urban_industrial', 'loft_style', 'warehouse_inspired',
    'raw_industrial', 'refined_industrial'
  ],
  SPECIALTY: [
    'ergonomic_design', 'sustainable_design', 'modular_system', 'space_saving',
    'multi_functional', 'convertible_design', 'stackable_design'
  ]
} as const;

// Technical Features for Commercial Furniture
export const FURNITURE_FEATURES = {
  FUNCTIONAL: [
    'height_adjustable', 'tilt_mechanism', 'swivel_function', 'locking_wheels',
    'soft_close_drawers', 'full_extension_slides', 'wire_management',
    'modular_configuration', 'stackable_design', 'folding_capability'
  ],
  
  ERGONOMIC: [
    'lumbar_support', 'adjustable_armrests', 'seat_depth_adjustment',
    'headrest_support', 'synchronized_tilt', 'seat_height_adjustment',
    'back_angle_adjustment', 'tension_control'
  ],
  
  TECHNICAL: [
    'integrated_power', 'usb_charging', 'led_lighting', 'wireless_charging',
    'cable_management_system', 'privacy_features', 'acoustic_properties',
    'antimicrobial_surface', 'stain_resistant_finish'
  ],
  
  SUSTAINABILITY: [
    'greenguard_certified', 'recycled_materials', 'sustainable_forestry',
    'low_voc_finishes', 'recyclable_components', 'carbon_neutral',
    'cradle_to_cradle_certified'
  ]
} as const;

// Commercial Photography Terminology
export const PHOTOGRAPHY_TERMS = {
  LIGHTING: [
    'three_point_lighting_setup', 'key_light_positioning_45_degrees', 'fill_light_ratio_3_to_1',
    'rim_lighting_effect_separation', 'soft_box_diffusion_24x36', 'umbrella_lighting_silver_interior',
    'continuous_led_lighting_5600k', 'strobe_lighting_pack_1000w', 'natural_daylight_balance_north_facing',
    'clamshell_lighting_beauty_setup', 'butterfly_lighting_portrait_style', 'loop_lighting_slight_shadow'
  ],
  
  CAMERA_ANGLES: [
    'three_quarter_view_optimal_detail', 'straight_front_view_technical_spec', 'profile_view_silhouette_emphasis', 
    'elevated_angle_15_degrees', 'eye_level_perspective_human_scale', 'hero_angle_dramatic_impact',
    'detail_macro_shot_100mm', 'environmental_wide_shot_24mm', 'birds_eye_view_flat_lay',
    'worms_eye_view_power_perspective', 'dutch_angle_dynamic_tension'
  ],
  
  COMPOSITION: [
    'rule_of_thirds_placement_intersection', 'leading_lines_furniture_edges', 'symmetrical_balance_centered_axis',
    'asymmetrical_balance_visual_weight', 'focal_point_emphasis_sharp_contrast', 'negative_space_utilization_breathing_room',
    'depth_of_field_f8_sharp_throughout', 'foreground_background_separation_bokeh', 'frame_within_frame_architectural',
    'golden_ratio_spiral_composition', 'triangular_composition_stability'
  ],
  
  BACKGROUNDS: [
    'seamless_white_backdrop_cyc_wall', 'gradient_background_white_to_gray', 'textured_surface_concrete_industrial',
    'lifestyle_environment_modern_interior', 'architectural_setting_minimalist_space', 'neutral_tone_backdrop_warm_gray',
    'high_key_lighting_bright_airy', 'low_key_dramatic_shadow_play', 'infinity_curve_seamless_transition',
    'colored_backdrop_corporate_branding', 'natural_wood_surface_warmth'
  ],

  TECHNICAL_SPECS: [
    'color_temperature_5600k_daylight', 'iso_100_minimal_noise', 'aperture_f8_optimal_sharpness',
    'shutter_speed_1_125_handheld_stable', 'white_balance_custom_gray_card', 'exposure_compensation_plus_third',
    'focus_stacking_infinite_depth', 'bracketed_exposure_hdr_potential', 'tethered_shooting_instant_review'
  ]
} as const;

// Wall Mounting Classifications
export const WALL_MOUNTING_TYPES = {
  DESK_SPECIFIC_MOUNTING: [
    'wall_mounted_desk_heavy_duty_bracket_system', 'fold_down_desk_piano_hinge_mechanism', 'floating_desk_hidden_cleat_system',
    'cantilever_desk_bracket_75cm_height', 'wall_desk_french_cleat_profile', 'suspended_desk_steel_bracket_mount',
    'fold_away_desk_mechanism_space_saving', 'wall_mounted_standing_desk_75cm_standard', 'floating_workstation_hidden_supports'
  ],
  
  MOUNTING_SYSTEMS: [
    'french_cleat_system_aluminum_profile', 'bracket_mount_system_steel_reinforced', 'hidden_bracket_mount_invisible_fixing',
    'floating_mount_system_cantilevered_design', 'track_mounting_system_adjustable_positioning', 'adjustable_rail_system_modular_components',
    'flush_mount_system_seamless_integration', 'pivot_mount_system_fold_down_mechanism', 'slide_mount_system_lateral_movement'
  ],
  
  HARDWARE_SPECIFICATIONS: [
    'heavy_duty_wall_anchors_grade_8', 'toggle_bolts_spring_loaded_316_stainless', 'molly_bolts_hollow_wall_fixings',
    'concrete_anchors_expansion_type_zinc_plated', 'wood_screws_into_studs_structural_grade', 'drywall_anchors_butterfly_type_50lb_rating',
    'mounting_plate_system_powder_coated_steel', 'threaded_rod_system_adjustable_depth', 'wall_cleat_hardened_steel_construction'
  ],
  
  DESK_HEIGHT_SPECIFICATIONS: [
    'wall_mounted_desk_75cm_floor_to_surface', 'standard_desk_height_75cm_29_5_inches', 'ergonomic_wall_desk_positioning',
    'commercial_wall_desk_height_standard', 'floating_desk_75cm_clearance_from_floor', 'wall_workstation_standard_height_mounting',
    'suspended_desk_ergonomic_height_positioning', 'wall_mounted_office_desk_standard_elevation'
  ],
  
  LOAD_REQUIREMENTS: [
    'light_duty_mounting_up_to_25_pounds', 'medium_load_capacity_25_to_75_pounds', 'heavy_duty_support_75_to_150_pounds',
    'commercial_grade_mounting_150_to_300_pounds', 'institutional_strength_300_plus_pounds', 'seismic_rated_earthquake_compliant',
    'dynamic_load_tested_movement_resistance', 'static_load_certified_permanent_installation', 'safety_factor_4_to_1_engineering_standard',
    'desk_load_rating_50_to_100kg_capacity', 'wall_desk_structural_support_requirements', 'floating_desk_cantilever_load_limits'
  ],

  INSTALLATION_REQUIREMENTS: [
    'stud_finder_required_16_inch_centers', 'level_installation_critical_alignment', 'drill_bit_masonry_carbide_tip',
    'torque_specifications_manufacturer_rated', 'wall_thickness_minimum_half_inch_drywall', 'backing_support_plywood_reinforcement',
    'electrical_clearance_code_compliance', 'plumbing_clearance_pipe_avoidance', 'hvac_duct_clearance_mechanical_systems'
  ]
} as const;

// Color Terminology for Furniture
export const COLOR_DESCRIPTIONS = {
  WOOD_TONES: [
    'natural_oak_grain', 'rich_walnut_brown', 'honey_maple_tone', 'espresso_dark_brown',
    'weathered_gray_wash', 'bleached_white_oak', 'rustic_barn_wood', 'ebony_black_stain'
  ],
  
  NEUTRAL_PALETTE: [
    'crisp_arctic_white', 'warm_off_white', 'soft_dove_gray', 'charcoal_graphite',
    'mushroom_taupe', 'pearl_silver', 'platinum_metallic', 'matte_black_finish'
  ],
  
  ACCENT_COLORS: [
    'corporate_navy_blue', 'forest_green_accent', 'burgundy_red_tone',
    'camel_tan_leather', 'sage_green_matte', 'terracotta_orange', 'deep_purple_velvet'
  ]
} as const;

// Context-Specific Requirements
export const CONTEXT_REQUIREMENTS = {
  PACKSHOT: {
    LIGHTING: 'studio_lighting_setup',
    BACKGROUND: 'seamless_white_backdrop',
    COMPOSITION: 'centered_product_focus',
    PURPOSE: 'catalog_product_photography'
  },
  
  LIFESTYLE: {
    LIGHTING: 'natural_ambient_lighting',
    BACKGROUND: 'realistic_interior_environment',
    COMPOSITION: 'contextual_room_setting',
    PURPOSE: 'environmental_product_showcase'
  },
  
  HERO: {
    LIGHTING: 'dramatic_accent_lighting',
    BACKGROUND: 'architectural_backdrop',
    COMPOSITION: 'banner_ready_composition',
    PURPOSE: 'website_header_imagery'
  },
  
  INSTAGRAM: {
    LIGHTING: 'social_media_optimized',
    BACKGROUND: 'lifestyle_appropriate',
    COMPOSITION: 'square_format_centered',
    PURPOSE: 'social_media_engagement'
  }
} as const;

// Utility Functions for Vocabulary Usage

export function getFurnitureTypeDescription(type: string): string {
  // Convert generic types to specific furniture terminology using enterprise classifications
  const typeMap: Record<string, string> = {
    'chair': 'professional_ergonomic_task_chair',
    'desk': 'commercial_executive_workstation',
    'wall_mounted_desk': 'wall_mounted_floating_desk_75cm_height',
    'wall_desk': 'floating_wall_desk_cantilever_design',
    'floating_desk': 'wall_mounted_desk_suspended_design',
    'table': 'conference_room_meeting_table',
    'cabinet': 'modular_storage_system_commercial_grade',
    'shelf': 'adjustable_shelving_unit_steel_construction',
    'lamp': 'articulating_led_desk_lamp',
    'stool': 'height_adjustable_drafting_stool',
    'bench': 'commercial_seating_bench',
    'dresser': 'bedroom_storage_dresser_solid_wood',
    'nightstand': 'bedside_table_two_drawer',
    'bookcase': 'library_bookshelf_adjustable_shelves',
    'wardrobe': 'bedroom_armoire_hanging_storage',
    'sofa': 'commercial_lounge_sofa_three_seat',
    'ottoman': 'upholstered_ottoman_storage',
    'sideboard': 'dining_room_credenza_buffet'
  };
  
  const normalizedType = type.toLowerCase().replace(/[-_\s]/g, '');
  
  // Check for partial matches in enterprise categories
  for (const [category, items] of Object.entries(FURNITURE_CATEGORIES)) {
    for (const [, products] of Object.entries(items)) {
      for (const product of products) {
        if (product.includes(normalizedType) || normalizedType.includes(product.replace(/[-_]/g, ''))) {
          return `${category.toLowerCase()}_${product}`;
        }
      }
    }
  }
  
  return typeMap[normalizedType] || `commercial_grade_${type.replace(/[-_\s]/g, '_')}`;
}

export function getMaterialDescription(material: string): string {
  const materialLower = material.toLowerCase();
  
  if (materialLower.includes('wood') || materialLower.includes('oak') || materialLower.includes('maple')) {
    return 'solid_hardwood_construction';
  }
  if (materialLower.includes('metal') || materialLower.includes('steel')) {
    return 'powder_coated_steel_frame';
  }
  if (materialLower.includes('leather')) {
    return 'full_grain_leather_upholstery';
  }
  if (materialLower.includes('fabric')) {
    return 'commercial_grade_fabric';
  }
  
  return `premium_${material}_construction`;
}

export function getStyleDescription(style: string): string {
  const styleLower = style.toLowerCase();
  
  if (styleLower.includes('modern')) return 'contemporary_commercial_design';
  if (styleLower.includes('traditional')) return 'classic_professional_styling';
  if (styleLower.includes('industrial')) return 'urban_industrial_aesthetic';
  if (styleLower.includes('minimal')) return 'clean_minimalist_design';
  
  return `professional_${style}_design`;
}

export function getConstraintDescription(constraint: string): string {
  const constraintMap: Record<string, string> = {
    'wall_mounted': 'securely_wall_mounted_installation',
    'no_floor_contact': 'suspended_wall_mounting_system',
    'commercial_grade': 'contract_quality_construction',
    'ergonomic': 'ergonomically_optimized_design',
    'modular': 'flexible_modular_configuration'
  };
  
  return constraintMap[constraint] || constraint;
}

// Technical specification builders
export function buildMaterialSpecification(materials: string[]): string {
  return materials
    .map(material => getMaterialDescription(material))
    .join(', ');
}

export function buildFeatureSpecification(features: string[]): string {
  return features
    .filter(feature => feature && feature.trim())
    .map(feature => {
      const featureLower = feature.toLowerCase();
      if (featureLower.includes('adjust')) return 'height_adjustable_mechanism';
      if (featureLower.includes('storage')) return 'integrated_storage_solution';
      if (featureLower.includes('wheel')) return 'smooth_rolling_casters';
      return `professional_${feature.replace(/\s+/g, '_')}`;
    })
    .join(', ');
}

export function buildContextSpecificTerminology(context: string): string {
  const contextTerms = CONTEXT_REQUIREMENTS[context.toUpperCase() as keyof typeof CONTEXT_REQUIREMENTS];
  if (!contextTerms) return 'professional_commercial_photography';
  
  return `${contextTerms.LIGHTING}_with_${contextTerms.BACKGROUND}_for_${contextTerms.PURPOSE}`;
}