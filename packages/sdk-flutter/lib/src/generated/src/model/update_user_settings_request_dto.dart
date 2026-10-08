//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_user_settings_request_dto.g.dart';

/// UpdateUserSettingsRequestDto
///
/// Properties:
/// * [preferredExtractorEngine] 
/// * [preferredChatProvider] 
/// * [useArenaWinnerAsDefault] 
/// * [labelFieldConfidenceThreshold] 
/// * [fieldExtractionConfidenceGateEnabled] 
/// * [fieldExtractionRequiredLabelIds] 
/// * [advancedFeaturesEnabled] 
/// * [themePreference] 
/// * [locale] 
@BuiltValue()
abstract class UpdateUserSettingsRequestDto implements Built<UpdateUserSettingsRequestDto, UpdateUserSettingsRequestDtoBuilder> {
  @BuiltValueField(wireName: r'preferredExtractorEngine')
  String? get preferredExtractorEngine;

  @BuiltValueField(wireName: r'preferredChatProvider')
  String? get preferredChatProvider;

  @BuiltValueField(wireName: r'useArenaWinnerAsDefault')
  bool? get useArenaWinnerAsDefault;

  @BuiltValueField(wireName: r'labelFieldConfidenceThreshold')
  num? get labelFieldConfidenceThreshold;

  @BuiltValueField(wireName: r'fieldExtractionConfidenceGateEnabled')
  bool? get fieldExtractionConfidenceGateEnabled;

  @BuiltValueField(wireName: r'fieldExtractionRequiredLabelIds')
  BuiltList<String>? get fieldExtractionRequiredLabelIds;

  @BuiltValueField(wireName: r'advancedFeaturesEnabled')
  bool? get advancedFeaturesEnabled;

  @BuiltValueField(wireName: r'themePreference')
  UpdateUserSettingsRequestDtoThemePreferenceEnum? get themePreference;
  // enum themePreferenceEnum {  light,  dark,  system,  };

  @BuiltValueField(wireName: r'locale')
  UpdateUserSettingsRequestDtoLocaleEnum? get locale;
  // enum localeEnum {  de,  en,  };

  UpdateUserSettingsRequestDto._();

  factory UpdateUserSettingsRequestDto([void updates(UpdateUserSettingsRequestDtoBuilder b)]) = _$UpdateUserSettingsRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateUserSettingsRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateUserSettingsRequestDto> get serializer => _$UpdateUserSettingsRequestDtoSerializer();
}

class _$UpdateUserSettingsRequestDtoSerializer implements PrimitiveSerializer<UpdateUserSettingsRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateUserSettingsRequestDto, _$UpdateUserSettingsRequestDto];

  @override
  final String wireName = r'UpdateUserSettingsRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateUserSettingsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.preferredExtractorEngine != null) {
      yield r'preferredExtractorEngine';
      yield serializers.serialize(
        object.preferredExtractorEngine,
        specifiedType: const FullType(String),
      );
    }
    if (object.preferredChatProvider != null) {
      yield r'preferredChatProvider';
      yield serializers.serialize(
        object.preferredChatProvider,
        specifiedType: const FullType(String),
      );
    }
    if (object.useArenaWinnerAsDefault != null) {
      yield r'useArenaWinnerAsDefault';
      yield serializers.serialize(
        object.useArenaWinnerAsDefault,
        specifiedType: const FullType(bool),
      );
    }
    if (object.labelFieldConfidenceThreshold != null) {
      yield r'labelFieldConfidenceThreshold';
      yield serializers.serialize(
        object.labelFieldConfidenceThreshold,
        specifiedType: const FullType(num),
      );
    }
    if (object.fieldExtractionConfidenceGateEnabled != null) {
      yield r'fieldExtractionConfidenceGateEnabled';
      yield serializers.serialize(
        object.fieldExtractionConfidenceGateEnabled,
        specifiedType: const FullType(bool),
      );
    }
    if (object.fieldExtractionRequiredLabelIds != null) {
      yield r'fieldExtractionRequiredLabelIds';
      yield serializers.serialize(
        object.fieldExtractionRequiredLabelIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.advancedFeaturesEnabled != null) {
      yield r'advancedFeaturesEnabled';
      yield serializers.serialize(
        object.advancedFeaturesEnabled,
        specifiedType: const FullType(bool),
      );
    }
    if (object.themePreference != null) {
      yield r'themePreference';
      yield serializers.serialize(
        object.themePreference,
        specifiedType: const FullType(UpdateUserSettingsRequestDtoThemePreferenceEnum),
      );
    }
    if (object.locale != null) {
      yield r'locale';
      yield serializers.serialize(
        object.locale,
        specifiedType: const FullType(UpdateUserSettingsRequestDtoLocaleEnum),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateUserSettingsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateUserSettingsRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'preferredExtractorEngine':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.preferredExtractorEngine = valueDes;
          break;
        case r'preferredChatProvider':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.preferredChatProvider = valueDes;
          break;
        case r'useArenaWinnerAsDefault':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.useArenaWinnerAsDefault = valueDes;
          break;
        case r'labelFieldConfidenceThreshold':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.labelFieldConfidenceThreshold = valueDes;
          break;
        case r'fieldExtractionConfidenceGateEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.fieldExtractionConfidenceGateEnabled = valueDes;
          break;
        case r'fieldExtractionRequiredLabelIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.fieldExtractionRequiredLabelIds.replace(valueDes);
          break;
        case r'advancedFeaturesEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.advancedFeaturesEnabled = valueDes;
          break;
        case r'themePreference':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateUserSettingsRequestDtoThemePreferenceEnum),
          ) as UpdateUserSettingsRequestDtoThemePreferenceEnum;
          result.themePreference = valueDes;
          break;
        case r'locale':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateUserSettingsRequestDtoLocaleEnum),
          ) as UpdateUserSettingsRequestDtoLocaleEnum;
          result.locale = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateUserSettingsRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateUserSettingsRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class UpdateUserSettingsRequestDtoThemePreferenceEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'light')
  static const UpdateUserSettingsRequestDtoThemePreferenceEnum light = _$updateUserSettingsRequestDtoThemePreferenceEnum_light;
  @BuiltValueEnumConst(wireName: r'dark')
  static const UpdateUserSettingsRequestDtoThemePreferenceEnum dark = _$updateUserSettingsRequestDtoThemePreferenceEnum_dark;
  @BuiltValueEnumConst(wireName: r'system')
  static const UpdateUserSettingsRequestDtoThemePreferenceEnum system = _$updateUserSettingsRequestDtoThemePreferenceEnum_system;

  static Serializer<UpdateUserSettingsRequestDtoThemePreferenceEnum> get serializer => _$updateUserSettingsRequestDtoThemePreferenceEnumSerializer;

  const UpdateUserSettingsRequestDtoThemePreferenceEnum._(String name): super(name);

  static BuiltSet<UpdateUserSettingsRequestDtoThemePreferenceEnum> get values => _$updateUserSettingsRequestDtoThemePreferenceEnumValues;
  static UpdateUserSettingsRequestDtoThemePreferenceEnum valueOf(String name) => _$updateUserSettingsRequestDtoThemePreferenceEnumValueOf(name);
}

class UpdateUserSettingsRequestDtoLocaleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'de')
  static const UpdateUserSettingsRequestDtoLocaleEnum de = _$updateUserSettingsRequestDtoLocaleEnum_de;
  @BuiltValueEnumConst(wireName: r'en')
  static const UpdateUserSettingsRequestDtoLocaleEnum en = _$updateUserSettingsRequestDtoLocaleEnum_en;

  static Serializer<UpdateUserSettingsRequestDtoLocaleEnum> get serializer => _$updateUserSettingsRequestDtoLocaleEnumSerializer;

  const UpdateUserSettingsRequestDtoLocaleEnum._(String name): super(name);

  static BuiltSet<UpdateUserSettingsRequestDtoLocaleEnum> get values => _$updateUserSettingsRequestDtoLocaleEnumValues;
  static UpdateUserSettingsRequestDtoLocaleEnum valueOf(String name) => _$updateUserSettingsRequestDtoLocaleEnumValueOf(name);
}

