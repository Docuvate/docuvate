// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_user_settings_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UpdateUserSettingsRequestDtoThemePreferenceEnum
    _$updateUserSettingsRequestDtoThemePreferenceEnum_light =
    const UpdateUserSettingsRequestDtoThemePreferenceEnum._('light');
const UpdateUserSettingsRequestDtoThemePreferenceEnum
    _$updateUserSettingsRequestDtoThemePreferenceEnum_dark =
    const UpdateUserSettingsRequestDtoThemePreferenceEnum._('dark');
const UpdateUserSettingsRequestDtoThemePreferenceEnum
    _$updateUserSettingsRequestDtoThemePreferenceEnum_system =
    const UpdateUserSettingsRequestDtoThemePreferenceEnum._('system');

UpdateUserSettingsRequestDtoThemePreferenceEnum
    _$updateUserSettingsRequestDtoThemePreferenceEnumValueOf(String name) {
  switch (name) {
    case 'light':
      return _$updateUserSettingsRequestDtoThemePreferenceEnum_light;
    case 'dark':
      return _$updateUserSettingsRequestDtoThemePreferenceEnum_dark;
    case 'system':
      return _$updateUserSettingsRequestDtoThemePreferenceEnum_system;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<UpdateUserSettingsRequestDtoThemePreferenceEnum>
    _$updateUserSettingsRequestDtoThemePreferenceEnumValues = new BuiltSet<
        UpdateUserSettingsRequestDtoThemePreferenceEnum>(const <UpdateUserSettingsRequestDtoThemePreferenceEnum>[
  _$updateUserSettingsRequestDtoThemePreferenceEnum_light,
  _$updateUserSettingsRequestDtoThemePreferenceEnum_dark,
  _$updateUserSettingsRequestDtoThemePreferenceEnum_system,
]);

const UpdateUserSettingsRequestDtoLocaleEnum
    _$updateUserSettingsRequestDtoLocaleEnum_de =
    const UpdateUserSettingsRequestDtoLocaleEnum._('de');
const UpdateUserSettingsRequestDtoLocaleEnum
    _$updateUserSettingsRequestDtoLocaleEnum_en =
    const UpdateUserSettingsRequestDtoLocaleEnum._('en');

UpdateUserSettingsRequestDtoLocaleEnum
    _$updateUserSettingsRequestDtoLocaleEnumValueOf(String name) {
  switch (name) {
    case 'de':
      return _$updateUserSettingsRequestDtoLocaleEnum_de;
    case 'en':
      return _$updateUserSettingsRequestDtoLocaleEnum_en;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<UpdateUserSettingsRequestDtoLocaleEnum>
    _$updateUserSettingsRequestDtoLocaleEnumValues = new BuiltSet<
        UpdateUserSettingsRequestDtoLocaleEnum>(const <UpdateUserSettingsRequestDtoLocaleEnum>[
  _$updateUserSettingsRequestDtoLocaleEnum_de,
  _$updateUserSettingsRequestDtoLocaleEnum_en,
]);

Serializer<UpdateUserSettingsRequestDtoThemePreferenceEnum>
    _$updateUserSettingsRequestDtoThemePreferenceEnumSerializer =
    new _$UpdateUserSettingsRequestDtoThemePreferenceEnumSerializer();
Serializer<UpdateUserSettingsRequestDtoLocaleEnum>
    _$updateUserSettingsRequestDtoLocaleEnumSerializer =
    new _$UpdateUserSettingsRequestDtoLocaleEnumSerializer();

class _$UpdateUserSettingsRequestDtoThemePreferenceEnumSerializer
    implements
        PrimitiveSerializer<UpdateUserSettingsRequestDtoThemePreferenceEnum> {
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
    UpdateUserSettingsRequestDtoThemePreferenceEnum
  ];
  @override
  final String wireName = 'UpdateUserSettingsRequestDtoThemePreferenceEnum';

  @override
  Object serialize(Serializers serializers,
          UpdateUserSettingsRequestDtoThemePreferenceEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UpdateUserSettingsRequestDtoThemePreferenceEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UpdateUserSettingsRequestDtoThemePreferenceEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UpdateUserSettingsRequestDtoLocaleEnumSerializer
    implements PrimitiveSerializer<UpdateUserSettingsRequestDtoLocaleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'de': 'de',
    'en': 'en',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'de': 'de',
    'en': 'en',
  };

  @override
  final Iterable<Type> types = const <Type>[
    UpdateUserSettingsRequestDtoLocaleEnum
  ];
  @override
  final String wireName = 'UpdateUserSettingsRequestDtoLocaleEnum';

  @override
  Object serialize(Serializers serializers,
          UpdateUserSettingsRequestDtoLocaleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UpdateUserSettingsRequestDtoLocaleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UpdateUserSettingsRequestDtoLocaleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UpdateUserSettingsRequestDto extends UpdateUserSettingsRequestDto {
  @override
  final String? preferredExtractorEngine;
  @override
  final String? preferredChatProvider;
  @override
  final bool? useArenaWinnerAsDefault;
  @override
  final num? labelFieldConfidenceThreshold;
  @override
  final bool? fieldExtractionConfidenceGateEnabled;
  @override
  final BuiltList<String>? fieldExtractionRequiredLabelIds;
  @override
  final bool? advancedFeaturesEnabled;
  @override
  final bool? fuzzyDuplicateDetectionEnabled;
  @override
  final UpdateUserSettingsRequestDtoThemePreferenceEnum? themePreference;
  @override
  final UpdateUserSettingsRequestDtoLocaleEnum? locale;
  @override
  final String? documentChatCloudBaseUrl;
  @override
  final String? documentChatCloudApiKey;

  factory _$UpdateUserSettingsRequestDto(
          [void Function(UpdateUserSettingsRequestDtoBuilder)? updates]) =>
      (new UpdateUserSettingsRequestDtoBuilder()..update(updates))._build();

  _$UpdateUserSettingsRequestDto._(
      {this.preferredExtractorEngine,
      this.preferredChatProvider,
      this.useArenaWinnerAsDefault,
      this.labelFieldConfidenceThreshold,
      this.fieldExtractionConfidenceGateEnabled,
      this.fieldExtractionRequiredLabelIds,
      this.advancedFeaturesEnabled,
      this.fuzzyDuplicateDetectionEnabled,
      this.themePreference,
      this.locale,
      this.documentChatCloudBaseUrl,
      this.documentChatCloudApiKey})
      : super._();

  @override
  UpdateUserSettingsRequestDto rebuild(
          void Function(UpdateUserSettingsRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateUserSettingsRequestDtoBuilder toBuilder() =>
      new UpdateUserSettingsRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateUserSettingsRequestDto &&
        preferredExtractorEngine == other.preferredExtractorEngine &&
        preferredChatProvider == other.preferredChatProvider &&
        useArenaWinnerAsDefault == other.useArenaWinnerAsDefault &&
        labelFieldConfidenceThreshold == other.labelFieldConfidenceThreshold &&
        fieldExtractionConfidenceGateEnabled ==
            other.fieldExtractionConfidenceGateEnabled &&
        fieldExtractionRequiredLabelIds ==
            other.fieldExtractionRequiredLabelIds &&
        advancedFeaturesEnabled == other.advancedFeaturesEnabled &&
        fuzzyDuplicateDetectionEnabled ==
            other.fuzzyDuplicateDetectionEnabled &&
        themePreference == other.themePreference &&
        locale == other.locale &&
        documentChatCloudBaseUrl == other.documentChatCloudBaseUrl &&
        documentChatCloudApiKey == other.documentChatCloudApiKey;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, preferredExtractorEngine.hashCode);
    _$hash = $jc(_$hash, preferredChatProvider.hashCode);
    _$hash = $jc(_$hash, useArenaWinnerAsDefault.hashCode);
    _$hash = $jc(_$hash, labelFieldConfidenceThreshold.hashCode);
    _$hash = $jc(_$hash, fieldExtractionConfidenceGateEnabled.hashCode);
    _$hash = $jc(_$hash, fieldExtractionRequiredLabelIds.hashCode);
    _$hash = $jc(_$hash, advancedFeaturesEnabled.hashCode);
    _$hash = $jc(_$hash, fuzzyDuplicateDetectionEnabled.hashCode);
    _$hash = $jc(_$hash, themePreference.hashCode);
    _$hash = $jc(_$hash, locale.hashCode);
    _$hash = $jc(_$hash, documentChatCloudBaseUrl.hashCode);
    _$hash = $jc(_$hash, documentChatCloudApiKey.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateUserSettingsRequestDto')
          ..add('preferredExtractorEngine', preferredExtractorEngine)
          ..add('preferredChatProvider', preferredChatProvider)
          ..add('useArenaWinnerAsDefault', useArenaWinnerAsDefault)
          ..add('labelFieldConfidenceThreshold', labelFieldConfidenceThreshold)
          ..add('fieldExtractionConfidenceGateEnabled',
              fieldExtractionConfidenceGateEnabled)
          ..add('fieldExtractionRequiredLabelIds',
              fieldExtractionRequiredLabelIds)
          ..add('advancedFeaturesEnabled', advancedFeaturesEnabled)
          ..add(
              'fuzzyDuplicateDetectionEnabled', fuzzyDuplicateDetectionEnabled)
          ..add('themePreference', themePreference)
          ..add('locale', locale)
          ..add('documentChatCloudBaseUrl', documentChatCloudBaseUrl)
          ..add('documentChatCloudApiKey', documentChatCloudApiKey))
        .toString();
  }
}

class UpdateUserSettingsRequestDtoBuilder
    implements
        Builder<UpdateUserSettingsRequestDto,
            UpdateUserSettingsRequestDtoBuilder> {
  _$UpdateUserSettingsRequestDto? _$v;

  String? _preferredExtractorEngine;
  String? get preferredExtractorEngine => _$this._preferredExtractorEngine;
  set preferredExtractorEngine(String? preferredExtractorEngine) =>
      _$this._preferredExtractorEngine = preferredExtractorEngine;

  String? _preferredChatProvider;
  String? get preferredChatProvider => _$this._preferredChatProvider;
  set preferredChatProvider(String? preferredChatProvider) =>
      _$this._preferredChatProvider = preferredChatProvider;

  bool? _useArenaWinnerAsDefault;
  bool? get useArenaWinnerAsDefault => _$this._useArenaWinnerAsDefault;
  set useArenaWinnerAsDefault(bool? useArenaWinnerAsDefault) =>
      _$this._useArenaWinnerAsDefault = useArenaWinnerAsDefault;

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
      _$this._fieldExtractionRequiredLabelIds ??= new ListBuilder<String>();
  set fieldExtractionRequiredLabelIds(
          ListBuilder<String>? fieldExtractionRequiredLabelIds) =>
      _$this._fieldExtractionRequiredLabelIds = fieldExtractionRequiredLabelIds;

  bool? _advancedFeaturesEnabled;
  bool? get advancedFeaturesEnabled => _$this._advancedFeaturesEnabled;
  set advancedFeaturesEnabled(bool? advancedFeaturesEnabled) =>
      _$this._advancedFeaturesEnabled = advancedFeaturesEnabled;

  bool? _fuzzyDuplicateDetectionEnabled;
  bool? get fuzzyDuplicateDetectionEnabled =>
      _$this._fuzzyDuplicateDetectionEnabled;
  set fuzzyDuplicateDetectionEnabled(bool? fuzzyDuplicateDetectionEnabled) =>
      _$this._fuzzyDuplicateDetectionEnabled = fuzzyDuplicateDetectionEnabled;

  UpdateUserSettingsRequestDtoThemePreferenceEnum? _themePreference;
  UpdateUserSettingsRequestDtoThemePreferenceEnum? get themePreference =>
      _$this._themePreference;
  set themePreference(
          UpdateUserSettingsRequestDtoThemePreferenceEnum? themePreference) =>
      _$this._themePreference = themePreference;

  UpdateUserSettingsRequestDtoLocaleEnum? _locale;
  UpdateUserSettingsRequestDtoLocaleEnum? get locale => _$this._locale;
  set locale(UpdateUserSettingsRequestDtoLocaleEnum? locale) =>
      _$this._locale = locale;

  String? _documentChatCloudBaseUrl;
  String? get documentChatCloudBaseUrl => _$this._documentChatCloudBaseUrl;
  set documentChatCloudBaseUrl(String? documentChatCloudBaseUrl) =>
      _$this._documentChatCloudBaseUrl = documentChatCloudBaseUrl;

  String? _documentChatCloudApiKey;
  String? get documentChatCloudApiKey => _$this._documentChatCloudApiKey;
  set documentChatCloudApiKey(String? documentChatCloudApiKey) =>
      _$this._documentChatCloudApiKey = documentChatCloudApiKey;

  UpdateUserSettingsRequestDtoBuilder() {
    UpdateUserSettingsRequestDto._defaults(this);
  }

  UpdateUserSettingsRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _preferredExtractorEngine = $v.preferredExtractorEngine;
      _preferredChatProvider = $v.preferredChatProvider;
      _useArenaWinnerAsDefault = $v.useArenaWinnerAsDefault;
      _labelFieldConfidenceThreshold = $v.labelFieldConfidenceThreshold;
      _fieldExtractionConfidenceGateEnabled =
          $v.fieldExtractionConfidenceGateEnabled;
      _fieldExtractionRequiredLabelIds =
          $v.fieldExtractionRequiredLabelIds?.toBuilder();
      _advancedFeaturesEnabled = $v.advancedFeaturesEnabled;
      _fuzzyDuplicateDetectionEnabled = $v.fuzzyDuplicateDetectionEnabled;
      _themePreference = $v.themePreference;
      _locale = $v.locale;
      _documentChatCloudBaseUrl = $v.documentChatCloudBaseUrl;
      _documentChatCloudApiKey = $v.documentChatCloudApiKey;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateUserSettingsRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$UpdateUserSettingsRequestDto;
  }

  @override
  void update(void Function(UpdateUserSettingsRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateUserSettingsRequestDto build() => _build();

  _$UpdateUserSettingsRequestDto _build() {
    _$UpdateUserSettingsRequestDto _$result;
    try {
      _$result = _$v ??
          new _$UpdateUserSettingsRequestDto._(
              preferredExtractorEngine: preferredExtractorEngine,
              preferredChatProvider: preferredChatProvider,
              useArenaWinnerAsDefault: useArenaWinnerAsDefault,
              labelFieldConfidenceThreshold: labelFieldConfidenceThreshold,
              fieldExtractionConfidenceGateEnabled:
                  fieldExtractionConfidenceGateEnabled,
              fieldExtractionRequiredLabelIds:
                  _fieldExtractionRequiredLabelIds?.build(),
              advancedFeaturesEnabled: advancedFeaturesEnabled,
              fuzzyDuplicateDetectionEnabled: fuzzyDuplicateDetectionEnabled,
              themePreference: themePreference,
              locale: locale,
              documentChatCloudBaseUrl: documentChatCloudBaseUrl,
              documentChatCloudApiKey: documentChatCloudApiKey);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fieldExtractionRequiredLabelIds';
        _fieldExtractionRequiredLabelIds?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'UpdateUserSettingsRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
