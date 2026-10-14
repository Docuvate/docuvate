// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_correspondent_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$createCorrespondentRequestDtoMatchingAlgorithmEnum_none =
    const CreateCorrespondentRequestDtoMatchingAlgorithmEnum._('none');
const CreateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$createCorrespondentRequestDtoMatchingAlgorithmEnum_any =
    const CreateCorrespondentRequestDtoMatchingAlgorithmEnum._('any');
const CreateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$createCorrespondentRequestDtoMatchingAlgorithmEnum_all =
    const CreateCorrespondentRequestDtoMatchingAlgorithmEnum._('all');
const CreateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$createCorrespondentRequestDtoMatchingAlgorithmEnum_exact =
    const CreateCorrespondentRequestDtoMatchingAlgorithmEnum._('exact');
const CreateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$createCorrespondentRequestDtoMatchingAlgorithmEnum_regex =
    const CreateCorrespondentRequestDtoMatchingAlgorithmEnum._('regex');

CreateCorrespondentRequestDtoMatchingAlgorithmEnum
    _$createCorrespondentRequestDtoMatchingAlgorithmEnumValueOf(String name) {
  switch (name) {
    case 'none':
      return _$createCorrespondentRequestDtoMatchingAlgorithmEnum_none;
    case 'any':
      return _$createCorrespondentRequestDtoMatchingAlgorithmEnum_any;
    case 'all':
      return _$createCorrespondentRequestDtoMatchingAlgorithmEnum_all;
    case 'exact':
      return _$createCorrespondentRequestDtoMatchingAlgorithmEnum_exact;
    case 'regex':
      return _$createCorrespondentRequestDtoMatchingAlgorithmEnum_regex;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<CreateCorrespondentRequestDtoMatchingAlgorithmEnum>
    _$createCorrespondentRequestDtoMatchingAlgorithmEnumValues = BuiltSet<
        CreateCorrespondentRequestDtoMatchingAlgorithmEnum>(const <CreateCorrespondentRequestDtoMatchingAlgorithmEnum>[
  _$createCorrespondentRequestDtoMatchingAlgorithmEnum_none,
  _$createCorrespondentRequestDtoMatchingAlgorithmEnum_any,
  _$createCorrespondentRequestDtoMatchingAlgorithmEnum_all,
  _$createCorrespondentRequestDtoMatchingAlgorithmEnum_exact,
  _$createCorrespondentRequestDtoMatchingAlgorithmEnum_regex,
]);

Serializer<CreateCorrespondentRequestDtoMatchingAlgorithmEnum>
    _$createCorrespondentRequestDtoMatchingAlgorithmEnumSerializer =
    _$CreateCorrespondentRequestDtoMatchingAlgorithmEnumSerializer();

class _$CreateCorrespondentRequestDtoMatchingAlgorithmEnumSerializer
    implements
        PrimitiveSerializer<
            CreateCorrespondentRequestDtoMatchingAlgorithmEnum> {
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
    CreateCorrespondentRequestDtoMatchingAlgorithmEnum
  ];
  @override
  final String wireName = 'CreateCorrespondentRequestDtoMatchingAlgorithmEnum';

  @override
  Object serialize(Serializers serializers,
          CreateCorrespondentRequestDtoMatchingAlgorithmEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateCorrespondentRequestDtoMatchingAlgorithmEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateCorrespondentRequestDtoMatchingAlgorithmEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateCorrespondentRequestDto extends CreateCorrespondentRequestDto {
  @override
  final String name;
  @override
  final CreateCorrespondentRequestDtoMatchingAlgorithmEnum? matchingAlgorithm;
  @override
  final String? match;

  factory _$CreateCorrespondentRequestDto(
          [void Function(CreateCorrespondentRequestDtoBuilder)? updates]) =>
      (CreateCorrespondentRequestDtoBuilder()..update(updates))._build();

  _$CreateCorrespondentRequestDto._(
      {required this.name, this.matchingAlgorithm, this.match})
      : super._();
  @override
  CreateCorrespondentRequestDto rebuild(
          void Function(CreateCorrespondentRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateCorrespondentRequestDtoBuilder toBuilder() =>
      CreateCorrespondentRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateCorrespondentRequestDto &&
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
    return (newBuiltValueToStringHelper(r'CreateCorrespondentRequestDto')
          ..add('name', name)
          ..add('matchingAlgorithm', matchingAlgorithm)
          ..add('match', match))
        .toString();
  }
}

class CreateCorrespondentRequestDtoBuilder
    implements
        Builder<CreateCorrespondentRequestDto,
            CreateCorrespondentRequestDtoBuilder> {
  _$CreateCorrespondentRequestDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  CreateCorrespondentRequestDtoMatchingAlgorithmEnum? _matchingAlgorithm;
  CreateCorrespondentRequestDtoMatchingAlgorithmEnum? get matchingAlgorithm =>
      _$this._matchingAlgorithm;
  set matchingAlgorithm(
          CreateCorrespondentRequestDtoMatchingAlgorithmEnum?
              matchingAlgorithm) =>
      _$this._matchingAlgorithm = matchingAlgorithm;

  String? _match;
  String? get match => _$this._match;
  set match(String? match) => _$this._match = match;

  CreateCorrespondentRequestDtoBuilder() {
    CreateCorrespondentRequestDto._defaults(this);
  }

  CreateCorrespondentRequestDtoBuilder get _$this {
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
  void replace(CreateCorrespondentRequestDto other) {
    _$v = other as _$CreateCorrespondentRequestDto;
  }

  @override
  void update(void Function(CreateCorrespondentRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateCorrespondentRequestDto build() => _build();

  _$CreateCorrespondentRequestDto _build() {
    final _$result = _$v ??
        _$CreateCorrespondentRequestDto._(
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'CreateCorrespondentRequestDto', 'name'),
          matchingAlgorithm: matchingAlgorithm,
          match: match,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
