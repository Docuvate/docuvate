// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'set_admin_user_feature_flag_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnum_layoutReconstructionCompare =
    const SetAdminUserFeatureFlagRequestDtoFlagEnum._(
        'layoutReconstructionCompare');
const SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnum_sourceConnectors =
    const SetAdminUserFeatureFlagRequestDtoFlagEnum._('sourceConnectors');
const SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnum_experimentalResearchModels =
    const SetAdminUserFeatureFlagRequestDtoFlagEnum._(
        'experimentalResearchModels');
const SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnum_exactAnswers =
    const SetAdminUserFeatureFlagRequestDtoFlagEnum._('exactAnswers');
const SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnum_smartDuplicates =
    const SetAdminUserFeatureFlagRequestDtoFlagEnum._('smartDuplicates');
const SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnum_answerAbstention =
    const SetAdminUserFeatureFlagRequestDtoFlagEnum._('answerAbstention');
const SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnum_learnedValueTypes =
    const SetAdminUserFeatureFlagRequestDtoFlagEnum._('learnedValueTypes');
const SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnum_layoutKeyValueRoles =
    const SetAdminUserFeatureFlagRequestDtoFlagEnum._('layoutKeyValueRoles');
const SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnum_localChatModel =
    const SetAdminUserFeatureFlagRequestDtoFlagEnum._('localChatModel');

SetAdminUserFeatureFlagRequestDtoFlagEnum
    _$setAdminUserFeatureFlagRequestDtoFlagEnumValueOf(String name) {
  switch (name) {
    case 'layoutReconstructionCompare':
      return _$setAdminUserFeatureFlagRequestDtoFlagEnum_layoutReconstructionCompare;
    case 'sourceConnectors':
      return _$setAdminUserFeatureFlagRequestDtoFlagEnum_sourceConnectors;
    case 'experimentalResearchModels':
      return _$setAdminUserFeatureFlagRequestDtoFlagEnum_experimentalResearchModels;
    case 'exactAnswers':
      return _$setAdminUserFeatureFlagRequestDtoFlagEnum_exactAnswers;
    case 'smartDuplicates':
      return _$setAdminUserFeatureFlagRequestDtoFlagEnum_smartDuplicates;
    case 'answerAbstention':
      return _$setAdminUserFeatureFlagRequestDtoFlagEnum_answerAbstention;
    case 'learnedValueTypes':
      return _$setAdminUserFeatureFlagRequestDtoFlagEnum_learnedValueTypes;
    case 'layoutKeyValueRoles':
      return _$setAdminUserFeatureFlagRequestDtoFlagEnum_layoutKeyValueRoles;
    case 'localChatModel':
      return _$setAdminUserFeatureFlagRequestDtoFlagEnum_localChatModel;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SetAdminUserFeatureFlagRequestDtoFlagEnum>
    _$setAdminUserFeatureFlagRequestDtoFlagEnumValues = BuiltSet<
        SetAdminUserFeatureFlagRequestDtoFlagEnum>(const <SetAdminUserFeatureFlagRequestDtoFlagEnum>[
  _$setAdminUserFeatureFlagRequestDtoFlagEnum_layoutReconstructionCompare,
  _$setAdminUserFeatureFlagRequestDtoFlagEnum_sourceConnectors,
  _$setAdminUserFeatureFlagRequestDtoFlagEnum_experimentalResearchModels,
  _$setAdminUserFeatureFlagRequestDtoFlagEnum_exactAnswers,
  _$setAdminUserFeatureFlagRequestDtoFlagEnum_smartDuplicates,
  _$setAdminUserFeatureFlagRequestDtoFlagEnum_answerAbstention,
  _$setAdminUserFeatureFlagRequestDtoFlagEnum_learnedValueTypes,
  _$setAdminUserFeatureFlagRequestDtoFlagEnum_layoutKeyValueRoles,
  _$setAdminUserFeatureFlagRequestDtoFlagEnum_localChatModel,
]);

Serializer<SetAdminUserFeatureFlagRequestDtoFlagEnum>
    _$setAdminUserFeatureFlagRequestDtoFlagEnumSerializer =
    _$SetAdminUserFeatureFlagRequestDtoFlagEnumSerializer();

class _$SetAdminUserFeatureFlagRequestDtoFlagEnumSerializer
    implements PrimitiveSerializer<SetAdminUserFeatureFlagRequestDtoFlagEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'layoutReconstructionCompare': 'layoutReconstructionCompare',
    'sourceConnectors': 'sourceConnectors',
    'experimentalResearchModels': 'experimentalResearchModels',
    'exactAnswers': 'exactAnswers',
    'smartDuplicates': 'smartDuplicates',
    'answerAbstention': 'answerAbstention',
    'learnedValueTypes': 'learnedValueTypes',
    'layoutKeyValueRoles': 'layoutKeyValueRoles',
    'localChatModel': 'localChatModel',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'layoutReconstructionCompare': 'layoutReconstructionCompare',
    'sourceConnectors': 'sourceConnectors',
    'experimentalResearchModels': 'experimentalResearchModels',
    'exactAnswers': 'exactAnswers',
    'smartDuplicates': 'smartDuplicates',
    'answerAbstention': 'answerAbstention',
    'learnedValueTypes': 'learnedValueTypes',
    'layoutKeyValueRoles': 'layoutKeyValueRoles',
    'localChatModel': 'localChatModel',
  };

  @override
  final Iterable<Type> types = const <Type>[
    SetAdminUserFeatureFlagRequestDtoFlagEnum
  ];
  @override
  final String wireName = 'SetAdminUserFeatureFlagRequestDtoFlagEnum';

  @override
  Object serialize(Serializers serializers,
          SetAdminUserFeatureFlagRequestDtoFlagEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SetAdminUserFeatureFlagRequestDtoFlagEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SetAdminUserFeatureFlagRequestDtoFlagEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SetAdminUserFeatureFlagRequestDto
    extends SetAdminUserFeatureFlagRequestDto {
  @override
  final SetAdminUserFeatureFlagRequestDtoFlagEnum flag;
  @override
  final bool enabled;

  factory _$SetAdminUserFeatureFlagRequestDto(
          [void Function(SetAdminUserFeatureFlagRequestDtoBuilder)? updates]) =>
      (SetAdminUserFeatureFlagRequestDtoBuilder()..update(updates))._build();

  _$SetAdminUserFeatureFlagRequestDto._(
      {required this.flag, required this.enabled})
      : super._();
  @override
  SetAdminUserFeatureFlagRequestDto rebuild(
          void Function(SetAdminUserFeatureFlagRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SetAdminUserFeatureFlagRequestDtoBuilder toBuilder() =>
      SetAdminUserFeatureFlagRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SetAdminUserFeatureFlagRequestDto &&
        flag == other.flag &&
        enabled == other.enabled;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, flag.hashCode);
    _$hash = $jc(_$hash, enabled.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SetAdminUserFeatureFlagRequestDto')
          ..add('flag', flag)
          ..add('enabled', enabled))
        .toString();
  }
}

class SetAdminUserFeatureFlagRequestDtoBuilder
    implements
        Builder<SetAdminUserFeatureFlagRequestDto,
            SetAdminUserFeatureFlagRequestDtoBuilder> {
  _$SetAdminUserFeatureFlagRequestDto? _$v;

  SetAdminUserFeatureFlagRequestDtoFlagEnum? _flag;
  SetAdminUserFeatureFlagRequestDtoFlagEnum? get flag => _$this._flag;
  set flag(SetAdminUserFeatureFlagRequestDtoFlagEnum? flag) =>
      _$this._flag = flag;

  bool? _enabled;
  bool? get enabled => _$this._enabled;
  set enabled(bool? enabled) => _$this._enabled = enabled;

  SetAdminUserFeatureFlagRequestDtoBuilder() {
    SetAdminUserFeatureFlagRequestDto._defaults(this);
  }

  SetAdminUserFeatureFlagRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _flag = $v.flag;
      _enabled = $v.enabled;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SetAdminUserFeatureFlagRequestDto other) {
    _$v = other as _$SetAdminUserFeatureFlagRequestDto;
  }

  @override
  void update(
      void Function(SetAdminUserFeatureFlagRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SetAdminUserFeatureFlagRequestDto build() => _build();

  _$SetAdminUserFeatureFlagRequestDto _build() {
    final _$result = _$v ??
        _$SetAdminUserFeatureFlagRequestDto._(
          flag: BuiltValueNullFieldError.checkNotNull(
              flag, r'SetAdminUserFeatureFlagRequestDto', 'flag'),
          enabled: BuiltValueNullFieldError.checkNotNull(
              enabled, r'SetAdminUserFeatureFlagRequestDto', 'enabled'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
