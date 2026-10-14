// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_correspondent_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_none =
    const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum._('none');
const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_any =
    const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum._('any');
const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_all =
    const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum._('all');
const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_exact =
    const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum._('exact');
const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_regex =
    const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum._('regex');

UpdateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$updateCorrespondentRequestDtoMatchingAlgorithmEnumValueOf(String name) {
  switch (name) {
    case 'none':
      return _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_none;
    case 'any':
      return _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_any;
    case 'all':
      return _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_all;
    case 'exact':
      return _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_exact;
    case 'regex':
      return _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_regex;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UpdateCorrespondentRequestDtoMatchingAlgorithmEnum>
    _$updateCorrespondentRequestDtoMatchingAlgorithmEnumValues = BuiltSet<
        UpdateCorrespondentRequestDtoMatchingAlgorithmEnum>(const <UpdateCorrespondentRequestDtoMatchingAlgorithmEnum>[
  _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_none,
  _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_any,
  _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_all,
  _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_exact,
  _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_regex,
]);

Serializer<UpdateCorrespondentRequestDtoMatchingAlgorithmEnum>
    _$updateCorrespondentRequestDtoMatchingAlgorithmEnumSerializer =
    _$UpdateCorrespondentRequestDtoMatchingAlgorithmEnumSerializer();

class _$UpdateCorrespondentRequestDtoMatchingAlgorithmEnumSerializer
    implements
        PrimitiveSerializer<
            UpdateCorrespondentRequestDtoMatchingAlgorithmEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'none': 'none',
    'any': 'any',
    'all': 'all',
    'exact': 'exact',
    'regex': 'regex',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'none': 'none',
    'any': 'any',
    'all': 'all',
    'exact': 'exact',
    'regex': 'regex',
  };

  @override
  final Iterable<Type> types = const <Type>[
    UpdateCorrespondentRequestDtoMatchingAlgorithmEnum
  ];
  @override
  final String wireName = 'UpdateCorrespondentRequestDtoMatchingAlgorithmEnum';

  @override
  Object serialize(Serializers serializers,
          UpdateCorrespondentRequestDtoMatchingAlgorithmEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UpdateCorrespondentRequestDtoMatchingAlgorithmEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UpdateCorrespondentRequestDtoMatchingAlgorithmEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UpdateCorrespondentRequestDto extends UpdateCorrespondentRequestDto {
  @override
  final String? name;
  @override
  final UpdateCorrespondentRequestDtoMatchingAlgorithmEnum? matchingAlgorithm;
  @override
  final String? match;

  factory _$UpdateCorrespondentRequestDto(
          [void Function(UpdateCorrespondentRequestDtoBuilder)? updates]) =>
      (UpdateCorrespondentRequestDtoBuilder()..update(updates))._build();

  _$UpdateCorrespondentRequestDto._(
      {this.name, this.matchingAlgorithm, this.match})
      : super._();
  @override
  UpdateCorrespondentRequestDto rebuild(
          void Function(UpdateCorrespondentRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateCorrespondentRequestDtoBuilder toBuilder() =>
      UpdateCorrespondentRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateCorrespondentRequestDto &&
        name == other.name &&
        matchingAlgorithm == other.matchingAlgorithm &&
        match == other.match;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, matchingAlgorithm.hashCode);
    _$hash = $jc(_$hash, match.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateCorrespondentRequestDto')
          ..add('name', name)
          ..add('matchingAlgorithm', matchingAlgorithm)
          ..add('match', match))
        .toString();
  }
}

class UpdateCorrespondentRequestDtoBuilder
    implements
        Builder<UpdateCorrespondentRequestDto,
            UpdateCorrespondentRequestDtoBuilder> {
  _$UpdateCorrespondentRequestDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  UpdateCorrespondentRequestDtoMatchingAlgorithmEnum? _matchingAlgorithm;
  UpdateCorrespondentRequestDtoMatchingAlgorithmEnum? get matchingAlgorithm =>
      _$this._matchingAlgorithm;
  set matchingAlgorithm(
          UpdateCorrespondentRequestDtoMatchingAlgorithmEnum?
              matchingAlgorithm) =>
      _$this._matchingAlgorithm = matchingAlgorithm;

  String? _match;
  String? get match => _$this._match;
  set match(String? match) => _$this._match = match;

  UpdateCorrespondentRequestDtoBuilder() {
    UpdateCorrespondentRequestDto._defaults(this);
  }

  UpdateCorrespondentRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _matchingAlgorithm = $v.matchingAlgorithm;
      _match = $v.match;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateCorrespondentRequestDto other) {
    _$v = other as _$UpdateCorrespondentRequestDto;
  }

  @override
  void update(void Function(UpdateCorrespondentRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateCorrespondentRequestDto build() => _build();

  _$UpdateCorrespondentRequestDto _build() {
    final _$result = _$v ??
        _$UpdateCorrespondentRequestDto._(
          name: name,
          matchingAlgorithm: matchingAlgorithm,
          match: match,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
