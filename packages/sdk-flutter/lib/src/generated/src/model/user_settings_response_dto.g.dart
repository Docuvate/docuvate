// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_settings_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UserSettingsResponseDtoDocumentChatReadinessEnum
    _$userSettingsResponseDtoDocumentChatReadinessEnum_ready =
    const UserSettingsResponseDtoDocumentChatReadinessEnum._('ready');
const UserSettingsResponseDtoDocumentChatReadinessEnum
    _$userSettingsResponseDtoDocumentChatReadinessEnum_off =
    const UserSettingsResponseDtoDocumentChatReadinessEnum._('off');
const UserSettingsResponseDtoDocumentChatReadinessEnum
    _$userSettingsResponseDtoDocumentChatReadinessEnum_unavailable =
    const UserSettingsResponseDtoDocumentChatReadinessEnum._('unavailable');
const UserSettingsResponseDtoDocumentChatReadinessEnum
    _$userSettingsResponseDtoDocumentChatReadinessEnum_starting =
    const UserSettingsResponseDtoDocumentChatReadinessEnum._('starting');

UserSettingsResponseDtoDocumentChatReadinessEnum
    _$userSettingsResponseDtoDocumentChatReadinessEnumValueOf(String name) {
  switch (name) {
    case 'ready':
      return _$userSettingsResponseDtoDocumentChatReadinessEnum_ready;
    case 'off':
      return _$userSettingsResponseDtoDocumentChatReadinessEnum_off;
    case 'unavailable':
      return _$userSettingsResponseDtoDocumentChatReadinessEnum_unavailable;
    case 'starting':
      return _$userSettingsResponseDtoDocumentChatReadinessEnum_starting;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserSettingsResponseDtoDocumentChatReadinessEnum>
    _$userSettingsResponseDtoDocumentChatReadinessEnumValues = BuiltSet<
        UserSettingsResponseDtoDocumentChatReadinessEnum>(const <UserSettingsResponseDtoDocumentChatReadinessEnum>[
  _$userSettingsResponseDtoDocumentChatReadinessEnum_ready,
  _$userSettingsResponseDtoDocumentChatReadinessEnum_off,
  _$userSettingsResponseDtoDocumentChatReadinessEnum_unavailable,
  _$userSettingsResponseDtoDocumentChatReadinessEnum_starting,
]);

const UserSettingsResponseDtoThemePreferenceEnum
    _$userSettingsResponseDtoThemePreferenceEnum_light =
    const UserSettingsResponseDtoThemePreferenceEnum._('light');
const UserSettingsResponseDtoThemePreferenceEnum
    _$userSettingsResponseDtoThemePreferenceEnum_dark =
    const UserSettingsResponseDtoThemePreferenceEnum._('dark');
const UserSettingsResponseDtoThemePreferenceEnum
    _$userSettingsResponseDtoThemePreferenceEnum_system =
    const UserSettingsResponseDtoThemePreferenceEnum._('system');

UserSettingsResponseDtoThemePreferenceEnum
    _$userSettingsResponseDtoThemePreferenceEnumValueOf(String name) {
  switch (name) {
    case 'light':
      return _$userSettingsResponseDtoThemePreferenceEnum_light;
    case 'dark':
      return _$userSettingsResponseDtoThemePreferenceEnum_dark;
    case 'system':
      return _$userSettingsResponseDtoThemePreferenceEnum_system;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserSettingsResponseDtoThemePreferenceEnum>
    _$userSettingsResponseDtoThemePreferenceEnumValues = BuiltSet<
        UserSettingsResponseDtoThemePreferenceEnum>(const <UserSettingsResponseDtoThemePreferenceEnum>[
  _$userSettingsResponseDtoThemePreferenceEnum_light,
  _$userSettingsResponseDtoThemePreferenceEnum_dark,
  _$userSettingsResponseDtoThemePreferenceEnum_system,
]);

const UserSettingsResponseDtoLocaleEnum _$userSettingsResponseDtoLocaleEnum_de =
    const UserSettingsResponseDtoLocaleEnum._('de');
const UserSettingsResponseDtoLocaleEnum _$userSettingsResponseDtoLocaleEnum_en =
    const UserSettingsResponseDtoLocaleEnum._('en');

UserSettingsResponseDtoLocaleEnum _$userSettingsResponseDtoLocaleEnumValueOf(
    String name) {
  switch (name) {
    case 'de':
      return _$userSettingsResponseDtoLocaleEnum_de;
    case 'en':
      return _$userSettingsResponseDtoLocaleEnum_en;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserSettingsResponseDtoLocaleEnum>
    _$userSettingsResponseDtoLocaleEnumValues = BuiltSet<
        UserSettingsResponseDtoLocaleEnum>(const <UserSettingsResponseDtoLocaleEnum>[
  _$userSettingsResponseDtoLocaleEnum_de,
  _$userSettingsResponseDtoLocaleEnum_en,
]);

Serializer<UserSettingsResponseDtoDocumentChatReadinessEnum>
    _$userSettingsResponseDtoDocumentChatReadinessEnumSerializer =
    _$UserSettingsResponseDtoDocumentChatReadinessEnumSerializer();
Serializer<UserSettingsResponseDtoThemePreferenceEnum>
    _$userSettingsResponseDtoThemePreferenceEnumSerializer =
    _$UserSettingsResponseDtoThemePreferenceEnumSerializer();
Serializer<UserSettingsResponseDtoLocaleEnum>
    _$userSettingsResponseDtoLocaleEnumSerializer =
    _$UserSettingsResponseDtoLocaleEnumSerializer();

class _$UserSettingsResponseDtoDocumentChatReadinessEnumSerializer
    implements
        PrimitiveSerializer<UserSettingsResponseDtoDocumentChatReadinessEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'ready': 'ready',
    'off': 'off',
    'unavailable': 'unavailable',
    'starting': 'starting',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'ready': 'ready',
    'off': 'off',
    'unavailable': 'unavailable',
    'starting': 'starting',
  };

  @override
  final Iterable<Type> types = const <Type>[
    UserSettingsResponseDtoDocumentChatReadinessEnum
  ];
  @override
  final String wireName = 'UserSettingsResponseDtoDocumentChatReadinessEnum';

  @override
  Object serialize(Serializers serializers,
          UserSettingsResponseDtoDocumentChatReadinessEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UserSettingsResponseDtoDocumentChatReadinessEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UserSettingsResponseDtoDocumentChatReadinessEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UserSettingsResponseDtoThemePreferenceEnumSerializer
    implements PrimitiveSerializer<UserSettingsResponseDtoThemePreferenceEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'light': 'light',
    'dark': 'dark',
    'system': 'system',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'light': 'light',
    'dark': 'dark',
    'system': 'system',
  };

  @override
  final Iterable<Type> types = const <Type>[
    UserSettingsResponseDtoThemePreferenceEnum
  ];
  @override
  final String wireName = 'UserSettingsResponseDtoThemePreferenceEnum';

  @override
  Object serialize(Serializers serializers,
          UserSettingsResponseDtoThemePreferenceEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UserSettingsResponseDtoThemePreferenceEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UserSettingsResponseDtoThemePreferenceEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UserSettingsResponseDtoLocaleEnumSerializer
    implements PrimitiveSerializer<UserSettingsResponseDtoLocaleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'de': 'de',
    'en': 'en',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'de': 'de',
    'en': 'en',
  };

  @override
  final Iterable<Type> types = const <Type>[UserSettingsResponseDtoLocaleEnum];
  @override
  final String wireName = 'UserSettingsResponseDtoLocaleEnum';

  @override
  Object serialize(
          Serializers serializers, UserSettingsResponseDtoLocaleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UserSettingsResponseDtoLocaleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UserSettingsResponseDtoLocaleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UserSettingsResponseDto extends UserSettingsResponseDto {
  @override
  final String preferredExtractorEngine;
  @override
  final String? preferredChatProvider;
  @override
  final String? effectiveChatProvider;
  @override
  final String? customerChatProvider;
  @override
  final bool? documentChatUiEnabled;
  @override
  final bool? documentChatAvailable;
  @override
  final UserSettingsResponseDtoDocumentChatReadinessEnum? documentChatReadiness;
  @override
  final String? documentChatReadinessReason;
  @override
  final String? documentChatOllamaModel;
  @override
  final bool? documentChatRunsOnCpu;
  @override
  final bool? advancedFeaturesEnabled;
  @override
  final bool useArenaWinnerAsDefault;
  @override
  final String? arenaWinnerEngine;
  @override
  final num? labelFieldConfidenceThreshold;
  @override
  final bool? fieldExtractionConfidenceGateEnabled;
  @override
  final BuiltList<String>? fieldExtractionRequiredLabelIds;
  @override
  final UserSettingsResponseDtoThemePreferenceEnum? themePreference;
  @override
  final UserSettingsResponseDtoLocaleEnum? locale;

  factory _$UserSettingsResponseDto(
          [void Function(UserSettingsResponseDtoBuilder)? updates]) =>
      (UserSettingsResponseDtoBuilder()..update(updates))._build();

  _$UserSettingsResponseDto._(
      {required this.preferredExtractorEngine,
      this.preferredChatProvider,
      this.effectiveChatProvider,
      this.customerChatProvider,
      this.documentChatUiEnabled,
      this.documentChatAvailable,
      this.documentChatReadiness,
      this.documentChatReadinessReason,
      this.documentChatOllamaModel,
      this.documentChatRunsOnCpu,
      this.advancedFeaturesEnabled,
      required this.useArenaWinnerAsDefault,
      this.arenaWinnerEngine,
      this.labelFieldConfidenceThreshold,
      this.fieldExtractionConfidenceGateEnabled,
      this.fieldExtractionRequiredLabelIds,
      this.themePreference,
      this.locale})
      : super._();
  @override
  UserSettingsResponseDto rebuild(
          void Function(UserSettingsResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserSettingsResponseDtoBuilder toBuilder() =>
      UserSettingsResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserSettingsResponseDto &&
        preferredExtractorEngine == other.preferredExtractorEngine &&
        preferredChatProvider == other.preferredChatProvider &&
        effectiveChatProvider == other.effectiveChatProvider &&
        customerChatProvider == other.customerChatProvider &&
        documentChatUiEnabled == other.documentChatUiEnabled &&
        documentChatAvailable == other.documentChatAvailable &&
        documentChatReadiness == other.documentChatReadiness &&
        documentChatReadinessReason == other.documentChatReadinessReason &&
        documentChatOllamaModel == other.documentChatOllamaModel &&
        documentChatRunsOnCpu == other.documentChatRunsOnCpu &&
        advancedFeaturesEnabled == other.advancedFeaturesEnabled &&
        useArenaWinnerAsDefault == other.useArenaWinnerAsDefault &&
        arenaWinnerEngine == other.arenaWinnerEngine &&
        labelFieldConfidenceThreshold == other.labelFieldConfidenceThreshold &&
        fieldExtractionConfidenceGateEnabled ==
            other.fieldExtractionConfidenceGateEnabled &&
        fieldExtractionRequiredLabelIds ==
            other.fieldExtractionRequiredLabelIds &&
        themePreference == other.themePreference &&
        locale == other.locale;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, preferredExtractorEngine.hashCode);
    _$hash = $jc(_$hash, preferredChatProvider.hashCode);
    _$hash = $jc(_$hash, effectiveChatProvider.hashCode);
    _$hash = $jc(_$hash, customerChatProvider.hashCode);
    _$hash = $jc(_$hash, documentChatUiEnabled.hashCode);
    _$hash = $jc(_$hash, documentChatAvailable.hashCode);
    _$hash = $jc(_$hash, documentChatReadiness.hashCode);
    _$hash = $jc(_$hash, documentChatReadinessReason.hashCode);
    _$hash = $jc(_$hash, documentChatOllamaModel.hashCode);
    _$hash = $jc(_$hash, documentChatRunsOnCpu.hashCode);
    _$hash = $jc(_$hash, advancedFeaturesEnabled.hashCode);
    _$hash = $jc(_$hash, useArenaWinnerAsDefault.hashCode);
    _$hash = $jc(_$hash, arenaWinnerEngine.hashCode);
    _$hash = $jc(_$hash, labelFieldConfidenceThreshold.hashCode);
    _$hash = $jc(_$hash, fieldExtractionConfidenceGateEnabled.hashCode);
    _$hash = $jc(_$hash, fieldExtractionRequiredLabelIds.hashCode);
    _$hash = $jc(_$hash, themePreference.hashCode);
    _$hash = $jc(_$hash, locale.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserSettingsResponseDto')
          ..add('preferredExtractorEngine', preferredExtractorEngine)
          ..add('preferredChatProvider', preferredChatProvider)
          ..add('effectiveChatProvider', effectiveChatProvider)
          ..add('customerChatProvider', customerChatProvider)
          ..add('documentChatUiEnabled', documentChatUiEnabled)
          ..add('documentChatAvailable', documentChatAvailable)
          ..add('documentChatReadiness', documentChatReadiness)
          ..add('documentChatReadinessReason', documentChatReadinessReason)
          ..add('documentChatOllamaModel', documentChatOllamaModel)
          ..add('documentChatRunsOnCpu', documentChatRunsOnCpu)
          ..add('advancedFeaturesEnabled', advancedFeaturesEnabled)
          ..add('useArenaWinnerAsDefault', useArenaWinnerAsDefault)
          ..add('arenaWinnerEngine', arenaWinnerEngine)
          ..add('labelFieldConfidenceThreshold', labelFieldConfidenceThreshold)
          ..add('fieldExtractionConfidenceGateEnabled',
              fieldExtractionConfidenceGateEnabled)
          ..add('fieldExtractionRequiredLabelIds',
              fieldExtractionRequiredLabelIds)
          ..add('themePreference', themePreference)
          ..add('locale', locale))
        .toString();
  }
}

class UserSettingsResponseDtoBuilder
    implements
        Builder<UserSettingsResponseDto, UserSettingsResponseDtoBuilder> {
  _$UserSettingsResponseDto? _$v;

  String? _preferredExtractorEngine;
  String? get preferredExtractorEngine => _$this._preferredExtractorEngine;
  set preferredExtractorEngine(String? preferredExtractorEngine) =>
      _$this._preferredExtractorEngine = preferredExtractorEngine;

  String? _preferredChatProvider;
  String? get preferredChatProvider => _$this._preferredChatProvider;
  set preferredChatProvider(String? preferredChatProvider) =>
      _$this._preferredChatProvider = preferredChatProvider;

  String? _effectiveChatProvider;
  String? get effectiveChatProvider => _$this._effectiveChatProvider;
  set effectiveChatProvider(String? effectiveChatProvider) =>
      _$this._effectiveChatProvider = effectiveChatProvider;

  String? _customerChatProvider;
  String? get customerChatProvider => _$this._customerChatProvider;
  set customerChatProvider(String? customerChatProvider) =>
      _$this._customerChatProvider = customerChatProvider;

  bool? _documentChatUiEnabled;
  bool? get documentChatUiEnabled => _$this._documentChatUiEnabled;
  set documentChatUiEnabled(bool? documentChatUiEnabled) =>
      _$this._documentChatUiEnabled = documentChatUiEnabled;

  bool? _documentChatAvailable;
  bool? get documentChatAvailable => _$this._documentChatAvailable;
  set documentChatAvailable(bool? documentChatAvailable) =>
      _$this._documentChatAvailable = documentChatAvailable;

  UserSettingsResponseDtoDocumentChatReadinessEnum? _documentChatReadiness;
  UserSettingsResponseDtoDocumentChatReadinessEnum? get documentChatReadiness =>
      _$this._documentChatReadiness;
  set documentChatReadiness(
          UserSettingsResponseDtoDocumentChatReadinessEnum?
              documentChatReadiness) =>
      _$this._documentChatReadiness = documentChatReadiness;

  String? _documentChatReadinessReason;
  String? get documentChatReadinessReason =>
      _$this._documentChatReadinessReason;
  set documentChatReadinessReason(String? documentChatReadinessReason) =>
      _$this._documentChatReadinessReason = documentChatReadinessReason;

  String? _documentChatOllamaModel;
  String? get documentChatOllamaModel => _$this._documentChatOllamaModel;
  set documentChatOllamaModel(String? documentChatOllamaModel) =>
      _$this._documentChatOllamaModel = documentChatOllamaModel;

  bool? _documentChatRunsOnCpu;
  bool? get documentChatRunsOnCpu => _$this._documentChatRunsOnCpu;
  set documentChatRunsOnCpu(bool? documentChatRunsOnCpu) =>
      _$this._documentChatRunsOnCpu = documentChatRunsOnCpu;

  bool? _advancedFeaturesEnabled;
  bool? get advancedFeaturesEnabled => _$this._advancedFeaturesEnabled;
  set advancedFeaturesEnabled(bool? advancedFeaturesEnabled) =>
      _$this._advancedFeaturesEnabled = advancedFeaturesEnabled;

  bool? _useArenaWinnerAsDefault;
  bool? get useArenaWinnerAsDefault => _$this._useArenaWinnerAsDefault;
  set useArenaWinnerAsDefault(bool? useArenaWinnerAsDefault) =>
      _$this._useArenaWinnerAsDefault = useArenaWinnerAsDefault;

  String? _arenaWinnerEngine;
  String? get arenaWinnerEngine => _$this._arenaWinnerEngine;
  set arenaWinnerEngine(String? arenaWinnerEngine) =>
      _$this._arenaWinnerEngine = arenaWinnerEngine;

  num? _labelFieldConfidenceThreshold;
  num? get labelFieldConfidenceThreshold =>
      _$this._labelFieldConfidenceThreshold;
  set labelFieldConfidenceThreshold(num? labelFieldConfidenceThreshold) =>
      _$this._labelFieldConfidenceThreshold = labelFieldConfidenceThreshold;

  bool? _fieldExtractionConfidenceGateEnabled;
  bool? get fieldExtractionConfidenceGateEnabled =>
      _$this._fieldExtractionConfidenceGateEnabled;
  set fieldExtractionConfidenceGateEnabled(
          bool? fieldExtractionConfidenceGateEnabled) =>
      _$this._fieldExtractionConfidenceGateEnabled =
          fieldExtractionConfidenceGateEnabled;

  ListBuilder<String>? _fieldExtractionRequiredLabelIds;
  ListBuilder<String> get fieldExtractionRequiredLabelIds =>
      _$this._fieldExtractionRequiredLabelIds ??= ListBuilder<String>();
  set fieldExtractionRequiredLabelIds(
          ListBuilder<String>? fieldExtractionRequiredLabelIds) =>
      _$this._fieldExtractionRequiredLabelIds = fieldExtractionRequiredLabelIds;

  UserSettingsResponseDtoThemePreferenceEnum? _themePreference;
  UserSettingsResponseDtoThemePreferenceEnum? get themePreference =>
      _$this._themePreference;
  set themePreference(
          UserSettingsResponseDtoThemePreferenceEnum? themePreference) =>
      _$this._themePreference = themePreference;

  UserSettingsResponseDtoLocaleEnum? _locale;
  UserSettingsResponseDtoLocaleEnum? get locale => _$this._locale;
  set locale(UserSettingsResponseDtoLocaleEnum? locale) =>
      _$this._locale = locale;

  UserSettingsResponseDtoBuilder() {
    UserSettingsResponseDto._defaults(this);
  }

  UserSettingsResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _preferredExtractorEngine = $v.preferredExtractorEngine;
      _preferredChatProvider = $v.preferredChatProvider;
      _effectiveChatProvider = $v.effectiveChatProvider;
      _customerChatProvider = $v.customerChatProvider;
      _documentChatUiEnabled = $v.documentChatUiEnabled;
      _documentChatAvailable = $v.documentChatAvailable;
      _documentChatReadiness = $v.documentChatReadiness;
      _documentChatReadinessReason = $v.documentChatReadinessReason;
      _documentChatOllamaModel = $v.documentChatOllamaModel;
      _documentChatRunsOnCpu = $v.documentChatRunsOnCpu;
      _advancedFeaturesEnabled = $v.advancedFeaturesEnabled;
      _useArenaWinnerAsDefault = $v.useArenaWinnerAsDefault;
      _arenaWinnerEngine = $v.arenaWinnerEngine;
      _labelFieldConfidenceThreshold = $v.labelFieldConfidenceThreshold;
      _fieldExtractionConfidenceGateEnabled =
          $v.fieldExtractionConfidenceGateEnabled;
      _fieldExtractionRequiredLabelIds =
          $v.fieldExtractionRequiredLabelIds?.toBuilder();
      _themePreference = $v.themePreference;
      _locale = $v.locale;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserSettingsResponseDto other) {
    _$v = other as _$UserSettingsResponseDto;
  }

  @override
  void update(void Function(UserSettingsResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserSettingsResponseDto build() => _build();

  _$UserSettingsResponseDto _build() {
    _$UserSettingsResponseDto _$result;
    try {
      _$result = _$v ??
          _$UserSettingsResponseDto._(
            preferredExtractorEngine: BuiltValueNullFieldError.checkNotNull(
                preferredExtractorEngine,
                r'UserSettingsResponseDto',
                'preferredExtractorEngine'),
            preferredChatProvider: preferredChatProvider,
            effectiveChatProvider: effectiveChatProvider,
            customerChatProvider: customerChatProvider,
            documentChatUiEnabled: documentChatUiEnabled,
            documentChatAvailable: documentChatAvailable,
            documentChatReadiness: documentChatReadiness,
            documentChatReadinessReason: documentChatReadinessReason,
            documentChatOllamaModel: documentChatOllamaModel,
            documentChatRunsOnCpu: documentChatRunsOnCpu,
            advancedFeaturesEnabled: advancedFeaturesEnabled,
            useArenaWinnerAsDefault: BuiltValueNullFieldError.checkNotNull(
                useArenaWinnerAsDefault,
                r'UserSettingsResponseDto',
                'useArenaWinnerAsDefault'),
            arenaWinnerEngine: arenaWinnerEngine,
            labelFieldConfidenceThreshold: labelFieldConfidenceThreshold,
            fieldExtractionConfidenceGateEnabled:
                fieldExtractionConfidenceGateEnabled,
            fieldExtractionRequiredLabelIds:
                _fieldExtractionRequiredLabelIds?.build(),
            themePreference: themePreference,
            locale: locale,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fieldExtractionRequiredLabelIds';
        _fieldExtractionRequiredLabelIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UserSettingsResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
