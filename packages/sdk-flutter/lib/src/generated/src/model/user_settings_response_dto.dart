//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_settings_response_dto.g.dart';

/// UserSettingsResponseDto
///
/// Properties:
/// * [preferredExtractorEngine] 
/// * [preferredChatProvider] 
/// * [effectiveChatProvider] 
/// * [customerChatProvider] 
/// * [documentChatUiEnabled] 
/// * [documentChatAvailable] 
/// * [documentChatReadiness] 
/// * [documentChatReadinessReason] 
/// * [documentChatOllamaModel] 
/// * [documentChatRunsOnCpu] 
/// * [advancedFeaturesEnabled] 
/// * [useArenaWinnerAsDefault] 
/// * [arenaWinnerEngine] 
/// * [labelFieldConfidenceThreshold] 
/// * [fieldExtractionConfidenceGateEnabled] 
/// * [fieldExtractionRequiredLabelIds] 
/// * [themePreference] 
/// * [locale] 
@BuiltValue()
abstract class UserSettingsResponseDto implements Built<UserSettingsResponseDto, UserSettingsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'preferredExtractorEngine')
  String get preferredExtractorEngine;

  @BuiltValueField(wireName: r'preferredChatProvider')
  String? get preferredChatProvider;

  @BuiltValueField(wireName: r'effectiveChatProvider')
  String? get effectiveChatProvider;

  @BuiltValueField(wireName: r'customerChatProvider')
  String? get customerChatProvider;

  @BuiltValueField(wireName: r'documentChatUiEnabled')
  bool? get documentChatUiEnabled;

  @BuiltValueField(wireName: r'documentChatAvailable')
  bool? get documentChatAvailable;

  @BuiltValueField(wireName: r'documentChatReadiness')
  UserSettingsResponseDtoDocumentChatReadinessEnum? get documentChatReadiness;
  // enum documentChatReadinessEnum {  ready,  off,  unavailable,  starting,  };

  @BuiltValueField(wireName: r'documentChatReadinessReason')
  String? get documentChatReadinessReason;

  @BuiltValueField(wireName: r'documentChatOllamaModel')
  String? get documentChatOllamaModel;

  @BuiltValueField(wireName: r'documentChatRunsOnCpu')
  bool? get documentChatRunsOnCpu;

  @BuiltValueField(wireName: r'advancedFeaturesEnabled')
  bool? get advancedFeaturesEnabled;

  @BuiltValueField(wireName: r'useArenaWinnerAsDefault')
  bool get useArenaWinnerAsDefault;

  @BuiltValueField(wireName: r'arenaWinnerEngine')
  String? get arenaWinnerEngine;

  @BuiltValueField(wireName: r'labelFieldConfidenceThreshold')
  num? get labelFieldConfidenceThreshold;

  @BuiltValueField(wireName: r'fieldExtractionConfidenceGateEnabled')
  bool? get fieldExtractionConfidenceGateEnabled;

  @BuiltValueField(wireName: r'fieldExtractionRequiredLabelIds')
  BuiltList<String>? get fieldExtractionRequiredLabelIds;

  @BuiltValueField(wireName: r'themePreference')
  UserSettingsResponseDtoThemePreferenceEnum? get themePreference;
  // enum themePreferenceEnum {  light,  dark,  system,  };

  @BuiltValueField(wireName: r'locale')
  UserSettingsResponseDtoLocaleEnum? get locale;
  // enum localeEnum {  de,  en,  };

  UserSettingsResponseDto._();

  factory UserSettingsResponseDto([void updates(UserSettingsResponseDtoBuilder b)]) = _$UserSettingsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserSettingsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserSettingsResponseDto> get serializer => _$UserSettingsResponseDtoSerializer();
}

class _$UserSettingsResponseDtoSerializer implements PrimitiveSerializer<UserSettingsResponseDto> {
  @override
  final Iterable<Type> types = const [UserSettingsResponseDto, _$UserSettingsResponseDto];

  @override
  final String wireName = r'UserSettingsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserSettingsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'preferredExtractorEngine';
    yield serializers.serialize(
      object.preferredExtractorEngine,
      specifiedType: const FullType(String),
    );
    if (object.preferredChatProvider != null) {
      yield r'preferredChatProvider';
      yield serializers.serialize(
        object.preferredChatProvider,
        specifiedType: const FullType(String),
      );
    }
    if (object.effectiveChatProvider != null) {
      yield r'effectiveChatProvider';
      yield serializers.serialize(
        object.effectiveChatProvider,
        specifiedType: const FullType(String),
      );
    }
    if (object.customerChatProvider != null) {
      yield r'customerChatProvider';
      yield serializers.serialize(
        object.customerChatProvider,
        specifiedType: const FullType(String),
      );
    }
    if (object.documentChatUiEnabled != null) {
      yield r'documentChatUiEnabled';
      yield serializers.serialize(
        object.documentChatUiEnabled,
        specifiedType: const FullType(bool),
      );
    }
    if (object.documentChatAvailable != null) {
      yield r'documentChatAvailable';
      yield serializers.serialize(
        object.documentChatAvailable,
        specifiedType: const FullType(bool),
      );
    }
    if (object.documentChatReadiness != null) {
      yield r'documentChatReadiness';
      yield serializers.serialize(
        object.documentChatReadiness,
        specifiedType: const FullType(UserSettingsResponseDtoDocumentChatReadinessEnum),
      );
    }
    if (object.documentChatReadinessReason != null) {
      yield r'documentChatReadinessReason';
      yield serializers.serialize(
        object.documentChatReadinessReason,
        specifiedType: const FullType(String),
      );
    }
    if (object.documentChatOllamaModel != null) {
      yield r'documentChatOllamaModel';
      yield serializers.serialize(
        object.documentChatOllamaModel,
        specifiedType: const FullType(String),
      );
    }
    if (object.documentChatRunsOnCpu != null) {
      yield r'documentChatRunsOnCpu';
      yield serializers.serialize(
        object.documentChatRunsOnCpu,
        specifiedType: const FullType(bool),
      );
    }
    if (object.advancedFeaturesEnabled != null) {
      yield r'advancedFeaturesEnabled';
      yield serializers.serialize(
        object.advancedFeaturesEnabled,
        specifiedType: const FullType(bool),
      );
    }
    yield r'useArenaWinnerAsDefault';
    yield serializers.serialize(
      object.useArenaWinnerAsDefault,
      specifiedType: const FullType(bool),
    );
    if (object.arenaWinnerEngine != null) {
      yield r'arenaWinnerEngine';
      yield serializers.serialize(
        object.arenaWinnerEngine,
        specifiedType: const FullType(String),
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
    if (object.themePreference != null) {
      yield r'themePreference';
      yield serializers.serialize(
        object.themePreference,
        specifiedType: const FullType(UserSettingsResponseDtoThemePreferenceEnum),
      );
    }
    if (object.locale != null) {
      yield r'locale';
      yield serializers.serialize(
        object.locale,
        specifiedType: const FullType(UserSettingsResponseDtoLocaleEnum),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UserSettingsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UserSettingsResponseDtoBuilder result,
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
        case r'effectiveChatProvider':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.effectiveChatProvider = valueDes;
          break;
        case r'customerChatProvider':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.customerChatProvider = valueDes;
          break;
        case r'documentChatUiEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.documentChatUiEnabled = valueDes;
          break;
        case r'documentChatAvailable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.documentChatAvailable = valueDes;
          break;
        case r'documentChatReadiness':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserSettingsResponseDtoDocumentChatReadinessEnum),
          ) as UserSettingsResponseDtoDocumentChatReadinessEnum;
          result.documentChatReadiness = valueDes;
          break;
        case r'documentChatReadinessReason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentChatReadinessReason = valueDes;
          break;
        case r'documentChatOllamaModel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentChatOllamaModel = valueDes;
          break;
        case r'documentChatRunsOnCpu':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.documentChatRunsOnCpu = valueDes;
          break;
        case r'advancedFeaturesEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.advancedFeaturesEnabled = valueDes;
          break;
        case r'useArenaWinnerAsDefault':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.useArenaWinnerAsDefault = valueDes;
          break;
        case r'arenaWinnerEngine':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.arenaWinnerEngine = valueDes;
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
        case r'themePreference':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserSettingsResponseDtoThemePreferenceEnum),
          ) as UserSettingsResponseDtoThemePreferenceEnum;
          result.themePreference = valueDes;
          break;
        case r'locale':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserSettingsResponseDtoLocaleEnum),
          ) as UserSettingsResponseDtoLocaleEnum;
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
  UserSettingsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserSettingsResponseDtoBuilder();
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

class UserSettingsResponseDtoDocumentChatReadinessEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'ready')
  static const UserSettingsResponseDtoDocumentChatReadinessEnum ready = _$userSettingsResponseDtoDocumentChatReadinessEnum_ready;
  @BuiltValueEnumConst(wireName: r'off')
  static const UserSettingsResponseDtoDocumentChatReadinessEnum off = _$userSettingsResponseDtoDocumentChatReadinessEnum_off;
  @BuiltValueEnumConst(wireName: r'unavailable')
  static const UserSettingsResponseDtoDocumentChatReadinessEnum unavailable = _$userSettingsResponseDtoDocumentChatReadinessEnum_unavailable;
  @BuiltValueEnumConst(wireName: r'starting')
  static const UserSettingsResponseDtoDocumentChatReadinessEnum starting = _$userSettingsResponseDtoDocumentChatReadinessEnum_starting;

  static Serializer<UserSettingsResponseDtoDocumentChatReadinessEnum> get serializer => _$userSettingsResponseDtoDocumentChatReadinessEnumSerializer;

  const UserSettingsResponseDtoDocumentChatReadinessEnum._(String name): super(name);

  static BuiltSet<UserSettingsResponseDtoDocumentChatReadinessEnum> get values => _$userSettingsResponseDtoDocumentChatReadinessEnumValues;
  static UserSettingsResponseDtoDocumentChatReadinessEnum valueOf(String name) => _$userSettingsResponseDtoDocumentChatReadinessEnumValueOf(name);
}

class UserSettingsResponseDtoThemePreferenceEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'light')
  static const UserSettingsResponseDtoThemePreferenceEnum light = _$userSettingsResponseDtoThemePreferenceEnum_light;
  @BuiltValueEnumConst(wireName: r'dark')
  static const UserSettingsResponseDtoThemePreferenceEnum dark = _$userSettingsResponseDtoThemePreferenceEnum_dark;
  @BuiltValueEnumConst(wireName: r'system')
  static const UserSettingsResponseDtoThemePreferenceEnum system = _$userSettingsResponseDtoThemePreferenceEnum_system;

  static Serializer<UserSettingsResponseDtoThemePreferenceEnum> get serializer => _$userSettingsResponseDtoThemePreferenceEnumSerializer;

  const UserSettingsResponseDtoThemePreferenceEnum._(String name): super(name);

  static BuiltSet<UserSettingsResponseDtoThemePreferenceEnum> get values => _$userSettingsResponseDtoThemePreferenceEnumValues;
  static UserSettingsResponseDtoThemePreferenceEnum valueOf(String name) => _$userSettingsResponseDtoThemePreferenceEnumValueOf(name);
}

class UserSettingsResponseDtoLocaleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'de')
  static const UserSettingsResponseDtoLocaleEnum de = _$userSettingsResponseDtoLocaleEnum_de;
  @BuiltValueEnumConst(wireName: r'en')
  static const UserSettingsResponseDtoLocaleEnum en = _$userSettingsResponseDtoLocaleEnum_en;

  static Serializer<UserSettingsResponseDtoLocaleEnum> get serializer => _$userSettingsResponseDtoLocaleEnumSerializer;

  const UserSettingsResponseDtoLocaleEnum._(String name): super(name);

  static BuiltSet<UserSettingsResponseDtoLocaleEnum> get values => _$userSettingsResponseDtoLocaleEnumValues;
  static UserSettingsResponseDtoLocaleEnum valueOf(String name) => _$userSettingsResponseDtoLocaleEnumValueOf(name);
}

