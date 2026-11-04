// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_settings_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

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
      throw new ArgumentError(name);
  }
}

final BuiltSet<UserSettingsResponseDtoThemePreferenceEnum>
    _$userSettingsResponseDtoThemePreferenceEnumValues = new BuiltSet<
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
      throw new ArgumentError(name);
  }
}

final BuiltSet<UserSettingsResponseDtoLocaleEnum>
    _$userSettingsResponseDtoLocaleEnumValues = new BuiltSet<
        UserSettingsResponseDtoLocaleEnum>(const <UserSettingsResponseDtoLocaleEnum>[
  _$userSettingsResponseDtoLocaleEnum_de,
  _$userSettingsResponseDtoLocaleEnum_en,
]);

Serializer<UserSettingsResponseDtoThemePreferenceEnum>
    _$userSettingsResponseDtoThemePreferenceEnumSerializer =
    new _$UserSettingsResponseDtoThemePreferenceEnumSerializer();
Serializer<UserSettingsResponseDtoLocaleEnum>
    _$userSettingsResponseDtoLocaleEnumSerializer =
    new _$UserSettingsResponseDtoLocaleEnumSerializer();

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
  final bool? advancedFeaturesEnabled;
  @override
  final bool useArenaWinnerAsDefault;
  @override
  final String? arenaWinnerEngine;
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
      (new UserSettingsResponseDtoBuilder()..update(updates))._build();

  _$UserSettingsResponseDto._(
      {required this.preferredExtractorEngine,
      this.advancedFeaturesEnabled,
      required this.useArenaWinnerAsDefault,
      this.arenaWinnerEngine,
      this.fieldExtractionConfidenceGateEnabled,
      this.fieldExtractionRequiredLabelIds,
      this.themePreference,
      this.locale})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(preferredExtractorEngine,
        r'UserSettingsResponseDto', 'preferredExtractorEngine');
    BuiltValueNullFieldError.checkNotNull(useArenaWinnerAsDefault,
        r'UserSettingsResponseDto', 'useArenaWinnerAsDefault');
  }

  @override
  UserSettingsResponseDto rebuild(
          void Function(UserSettingsResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserSettingsResponseDtoBuilder toBuilder() =>
      new UserSettingsResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserSettingsResponseDto &&
        preferredExtractorEngine == other.preferredExtractorEngine &&
        advancedFeaturesEnabled == other.advancedFeaturesEnabled &&
        useArenaWinnerAsDefault == other.useArenaWinnerAsDefault &&
        arenaWinnerEngine == other.arenaWinnerEngine &&
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
    _$hash = $jc(_$hash, advancedFeaturesEnabled.hashCode);
    _$hash = $jc(_$hash, useArenaWinnerAsDefault.hashCode);
    _$hash = $jc(_$hash, arenaWinnerEngine.hashCode);
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
          ..add('advancedFeaturesEnabled', advancedFeaturesEnabled)
          ..add('useArenaWinnerAsDefault', useArenaWinnerAsDefault)
          ..add('arenaWinnerEngine', arenaWinnerEngine)
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
      _advancedFeaturesEnabled = $v.advancedFeaturesEnabled;
      _useArenaWinnerAsDefault = $v.useArenaWinnerAsDefault;
      _arenaWinnerEngine = $v.arenaWinnerEngine;
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
    ArgumentError.checkNotNull(other, 'other');
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
          new _$UserSettingsResponseDto._(
              preferredExtractorEngine: BuiltValueNullFieldError.checkNotNull(
                  preferredExtractorEngine,
                  r'UserSettingsResponseDto',
                  'preferredExtractorEngine'),
              advancedFeaturesEnabled: advancedFeaturesEnabled,
              useArenaWinnerAsDefault: BuiltValueNullFieldError.checkNotNull(
                  useArenaWinnerAsDefault,
                  r'UserSettingsResponseDto',
                  'useArenaWinnerAsDefault'),
              arenaWinnerEngine: arenaWinnerEngine,
              fieldExtractionConfidenceGateEnabled:
                  fieldExtractionConfidenceGateEnabled,
              fieldExtractionRequiredLabelIds:
                  _fieldExtractionRequiredLabelIds?.build(),
              themePreference: themePreference,
              locale: locale);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fieldExtractionRequiredLabelIds';
        _fieldExtractionRequiredLabelIds?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'UserSettingsResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
