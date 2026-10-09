// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'set_ml_model_lifecycle_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SetMlModelLifecycleRequestDtoLifecycleEnum
    _$setMlModelLifecycleRequestDtoLifecycleEnum_failed =
    const SetMlModelLifecycleRequestDtoLifecycleEnum._('failed');
const SetMlModelLifecycleRequestDtoLifecycleEnum
    _$setMlModelLifecycleRequestDtoLifecycleEnum_active =
    const SetMlModelLifecycleRequestDtoLifecycleEnum._('active');
const SetMlModelLifecycleRequestDtoLifecycleEnum
    _$setMlModelLifecycleRequestDtoLifecycleEnum_registered =
    const SetMlModelLifecycleRequestDtoLifecycleEnum._('registered');
const SetMlModelLifecycleRequestDtoLifecycleEnum
    _$setMlModelLifecycleRequestDtoLifecycleEnum_canary =
    const SetMlModelLifecycleRequestDtoLifecycleEnum._('canary');
const SetMlModelLifecycleRequestDtoLifecycleEnum
    _$setMlModelLifecycleRequestDtoLifecycleEnum_archived =
    const SetMlModelLifecycleRequestDtoLifecycleEnum._('archived');

SetMlModelLifecycleRequestDtoLifecycleEnum
    _$setMlModelLifecycleRequestDtoLifecycleEnumValueOf(String name) {
  switch (name) {
    case 'failed':
      return _$setMlModelLifecycleRequestDtoLifecycleEnum_failed;
    case 'active':
      return _$setMlModelLifecycleRequestDtoLifecycleEnum_active;
    case 'registered':
      return _$setMlModelLifecycleRequestDtoLifecycleEnum_registered;
    case 'canary':
      return _$setMlModelLifecycleRequestDtoLifecycleEnum_canary;
    case 'archived':
      return _$setMlModelLifecycleRequestDtoLifecycleEnum_archived;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SetMlModelLifecycleRequestDtoLifecycleEnum>
    _$setMlModelLifecycleRequestDtoLifecycleEnumValues = BuiltSet<
        SetMlModelLifecycleRequestDtoLifecycleEnum>(const <SetMlModelLifecycleRequestDtoLifecycleEnum>[
  _$setMlModelLifecycleRequestDtoLifecycleEnum_failed,
  _$setMlModelLifecycleRequestDtoLifecycleEnum_active,
  _$setMlModelLifecycleRequestDtoLifecycleEnum_registered,
  _$setMlModelLifecycleRequestDtoLifecycleEnum_canary,
  _$setMlModelLifecycleRequestDtoLifecycleEnum_archived,
]);

Serializer<SetMlModelLifecycleRequestDtoLifecycleEnum>
    _$setMlModelLifecycleRequestDtoLifecycleEnumSerializer =
    _$SetMlModelLifecycleRequestDtoLifecycleEnumSerializer();

class _$SetMlModelLifecycleRequestDtoLifecycleEnumSerializer
    implements PrimitiveSerializer<SetMlModelLifecycleRequestDtoLifecycleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'failed': 'failed',
    'active': 'active',
    'registered': 'registered',
    'canary': 'canary',
    'archived': 'archived',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'failed': 'failed',
    'active': 'active',
    'registered': 'registered',
    'canary': 'canary',
    'archived': 'archived',
  };

  @override
  final Iterable<Type> types = const <Type>[
    SetMlModelLifecycleRequestDtoLifecycleEnum
  ];
  @override
  final String wireName = 'SetMlModelLifecycleRequestDtoLifecycleEnum';

  @override
  Object serialize(Serializers serializers,
          SetMlModelLifecycleRequestDtoLifecycleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SetMlModelLifecycleRequestDtoLifecycleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SetMlModelLifecycleRequestDtoLifecycleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SetMlModelLifecycleRequestDto extends SetMlModelLifecycleRequestDto {
  @override
  final SetMlModelLifecycleRequestDtoLifecycleEnum lifecycle;

  factory _$SetMlModelLifecycleRequestDto(
          [void Function(SetMlModelLifecycleRequestDtoBuilder)? updates]) =>
      (SetMlModelLifecycleRequestDtoBuilder()..update(updates))._build();

  _$SetMlModelLifecycleRequestDto._({required this.lifecycle}) : super._();
  @override
  SetMlModelLifecycleRequestDto rebuild(
          void Function(SetMlModelLifecycleRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SetMlModelLifecycleRequestDtoBuilder toBuilder() =>
      SetMlModelLifecycleRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SetMlModelLifecycleRequestDto &&
        lifecycle == other.lifecycle;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, lifecycle.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SetMlModelLifecycleRequestDto')
          ..add('lifecycle', lifecycle))
        .toString();
  }
}

class SetMlModelLifecycleRequestDtoBuilder
    implements
        Builder<SetMlModelLifecycleRequestDto,
            SetMlModelLifecycleRequestDtoBuilder> {
  _$SetMlModelLifecycleRequestDto? _$v;

  SetMlModelLifecycleRequestDtoLifecycleEnum? _lifecycle;
  SetMlModelLifecycleRequestDtoLifecycleEnum? get lifecycle =>
      _$this._lifecycle;
  set lifecycle(SetMlModelLifecycleRequestDtoLifecycleEnum? lifecycle) =>
      _$this._lifecycle = lifecycle;

  SetMlModelLifecycleRequestDtoBuilder() {
    SetMlModelLifecycleRequestDto._defaults(this);
  }

  SetMlModelLifecycleRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _lifecycle = $v.lifecycle;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SetMlModelLifecycleRequestDto other) {
    _$v = other as _$SetMlModelLifecycleRequestDto;
  }

  @override
  void update(void Function(SetMlModelLifecycleRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SetMlModelLifecycleRequestDto build() => _build();

  _$SetMlModelLifecycleRequestDto _build() {
    final _$result = _$v ??
        _$SetMlModelLifecycleRequestDto._(
          lifecycle: BuiltValueNullFieldError.checkNotNull(
              lifecycle, r'SetMlModelLifecycleRequestDto', 'lifecycle'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
