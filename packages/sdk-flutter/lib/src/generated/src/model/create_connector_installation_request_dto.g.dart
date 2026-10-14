// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_connector_installation_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateConnectorInstallationRequestDtoPluginIdEnum
    _$createConnectorInstallationRequestDtoPluginIdEnum_gmail =
    const CreateConnectorInstallationRequestDtoPluginIdEnum._('gmail');
const CreateConnectorInstallationRequestDtoPluginIdEnum
    _$createConnectorInstallationRequestDtoPluginIdEnum_outlook =
    const CreateConnectorInstallationRequestDtoPluginIdEnum._('outlook');
const CreateConnectorInstallationRequestDtoPluginIdEnum
    _$createConnectorInstallationRequestDtoPluginIdEnum_paperless =
    const CreateConnectorInstallationRequestDtoPluginIdEnum._('paperless');
const CreateConnectorInstallationRequestDtoPluginIdEnum
    _$createConnectorInstallationRequestDtoPluginIdEnum_homeAssistant =
    const CreateConnectorInstallationRequestDtoPluginIdEnum._('homeAssistant');
const CreateConnectorInstallationRequestDtoPluginIdEnum
    _$createConnectorInstallationRequestDtoPluginIdEnum_amazonS3 =
    const CreateConnectorInstallationRequestDtoPluginIdEnum._('amazonS3');

CreateConnectorInstallationRequestDtoPluginIdEnum
    _$createConnectorInstallationRequestDtoPluginIdEnumValueOf(String name) {
  switch (name) {
    case 'gmail':
      return _$createConnectorInstallationRequestDtoPluginIdEnum_gmail;
    case 'outlook':
      return _$createConnectorInstallationRequestDtoPluginIdEnum_outlook;
    case 'paperless':
      return _$createConnectorInstallationRequestDtoPluginIdEnum_paperless;
    case 'homeAssistant':
      return _$createConnectorInstallationRequestDtoPluginIdEnum_homeAssistant;
    case 'amazonS3':
      return _$createConnectorInstallationRequestDtoPluginIdEnum_amazonS3;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CreateConnectorInstallationRequestDtoPluginIdEnum>
    _$createConnectorInstallationRequestDtoPluginIdEnumValues = BuiltSet<
        CreateConnectorInstallationRequestDtoPluginIdEnum>(const <CreateConnectorInstallationRequestDtoPluginIdEnum>[
  _$createConnectorInstallationRequestDtoPluginIdEnum_gmail,
  _$createConnectorInstallationRequestDtoPluginIdEnum_outlook,
  _$createConnectorInstallationRequestDtoPluginIdEnum_paperless,
  _$createConnectorInstallationRequestDtoPluginIdEnum_homeAssistant,
  _$createConnectorInstallationRequestDtoPluginIdEnum_amazonS3,
]);

Serializer<CreateConnectorInstallationRequestDtoPluginIdEnum>
    _$createConnectorInstallationRequestDtoPluginIdEnumSerializer =
    _$CreateConnectorInstallationRequestDtoPluginIdEnumSerializer();

class _$CreateConnectorInstallationRequestDtoPluginIdEnumSerializer
    implements
        PrimitiveSerializer<CreateConnectorInstallationRequestDtoPluginIdEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'gmail': 'gmail',
    'outlook': 'outlook',
    'paperless': 'paperless',
    'homeAssistant': 'home_assistant',
    'amazonS3': 'amazon_s3',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'gmail': 'gmail',
    'outlook': 'outlook',
    'paperless': 'paperless',
    'home_assistant': 'homeAssistant',
    'amazon_s3': 'amazonS3',
  };

  @override
  final Iterable<Type> types = const <Type>[
    CreateConnectorInstallationRequestDtoPluginIdEnum
  ];
  @override
  final String wireName = 'CreateConnectorInstallationRequestDtoPluginIdEnum';

  @override
  Object serialize(Serializers serializers,
          CreateConnectorInstallationRequestDtoPluginIdEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateConnectorInstallationRequestDtoPluginIdEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateConnectorInstallationRequestDtoPluginIdEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateConnectorInstallationRequestDto
    extends CreateConnectorInstallationRequestDto {
  @override
  final CreateConnectorInstallationRequestDtoPluginIdEnum pluginId;
  @override
  final String displayName;
  @override
  final BuiltMap<String, String> credentials;

  factory _$CreateConnectorInstallationRequestDto(
          [void Function(CreateConnectorInstallationRequestDtoBuilder)?
              updates]) =>
      (CreateConnectorInstallationRequestDtoBuilder()..update(updates))
          ._build();

  _$CreateConnectorInstallationRequestDto._(
      {required this.pluginId,
      required this.displayName,
      required this.credentials})
      : super._();
  @override
  CreateConnectorInstallationRequestDto rebuild(
          void Function(CreateConnectorInstallationRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateConnectorInstallationRequestDtoBuilder toBuilder() =>
      CreateConnectorInstallationRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateConnectorInstallationRequestDto &&
        pluginId == other.pluginId &&
        displayName == other.displayName &&
        credentials == other.credentials;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, pluginId.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, credentials.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'CreateConnectorInstallationRequestDto')
          ..add('pluginId', pluginId)
          ..add('displayName', displayName)
          ..add('credentials', credentials))
        .toString();
  }
}

class CreateConnectorInstallationRequestDtoBuilder
    implements
        Builder<CreateConnectorInstallationRequestDto,
            CreateConnectorInstallationRequestDtoBuilder> {
  _$CreateConnectorInstallationRequestDto? _$v;

  CreateConnectorInstallationRequestDtoPluginIdEnum? _pluginId;
  CreateConnectorInstallationRequestDtoPluginIdEnum? get pluginId =>
      _$this._pluginId;
  set pluginId(CreateConnectorInstallationRequestDtoPluginIdEnum? pluginId) =>
      _$this._pluginId = pluginId;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  MapBuilder<String, String>? _credentials;
  MapBuilder<String, String> get credentials =>
      _$this._credentials ??= MapBuilder<String, String>();
  set credentials(MapBuilder<String, String>? credentials) =>
      _$this._credentials = credentials;

  CreateConnectorInstallationRequestDtoBuilder() {
    CreateConnectorInstallationRequestDto._defaults(this);
  }

  CreateConnectorInstallationRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _pluginId = $v.pluginId;
      _displayName = $v.displayName;
      _credentials = $v.credentials.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateConnectorInstallationRequestDto other) {
    _$v = other as _$CreateConnectorInstallationRequestDto;
  }

  @override
  void update(
      void Function(CreateConnectorInstallationRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateConnectorInstallationRequestDto build() => _build();

  _$CreateConnectorInstallationRequestDto _build() {
    _$CreateConnectorInstallationRequestDto _$result;
    try {
      _$result = _$v ??
          _$CreateConnectorInstallationRequestDto._(
            pluginId: BuiltValueNullFieldError.checkNotNull(
                pluginId, r'CreateConnectorInstallationRequestDto', 'pluginId'),
            displayName: BuiltValueNullFieldError.checkNotNull(displayName,
                r'CreateConnectorInstallationRequestDto', 'displayName'),
            credentials: credentials.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'credentials';
        credentials.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'CreateConnectorInstallationRequestDto',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
