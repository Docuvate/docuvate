// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_tag_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateTagRequestDtoMatchingAlgorithmEnum
    _$createTagRequestDtoMatchingAlgorithmEnum_none =
    const CreateTagRequestDtoMatchingAlgorithmEnum._('none');
const CreateTagRequestDtoMatchingAlgorithmEnum
    _$createTagRequestDtoMatchingAlgorithmEnum_any =
    const CreateTagRequestDtoMatchingAlgorithmEnum._('any');
const CreateTagRequestDtoMatchingAlgorithmEnum
    _$createTagRequestDtoMatchingAlgorithmEnum_all =
    const CreateTagRequestDtoMatchingAlgorithmEnum._('all');
const CreateTagRequestDtoMatchingAlgorithmEnum
    _$createTagRequestDtoMatchingAlgorithmEnum_exact =
    const CreateTagRequestDtoMatchingAlgorithmEnum._('exact');
const CreateTagRequestDtoMatchingAlgorithmEnum
    _$createTagRequestDtoMatchingAlgorithmEnum_regex =
    const CreateTagRequestDtoMatchingAlgorithmEnum._('regex');

CreateTagRequestDtoMatchingAlgorithmEnum
    _$createTagRequestDtoMatchingAlgorithmEnumValueOf(String name) {
  switch (name) {
    case 'none':
      return _$createTagRequestDtoMatchingAlgorithmEnum_none;
    case 'any':
      return _$createTagRequestDtoMatchingAlgorithmEnum_any;
    case 'all':
      return _$createTagRequestDtoMatchingAlgorithmEnum_all;
    case 'exact':
      return _$createTagRequestDtoMatchingAlgorithmEnum_exact;
    case 'regex':
      return _$createTagRequestDtoMatchingAlgorithmEnum_regex;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<CreateTagRequestDtoMatchingAlgorithmEnum>
    _$createTagRequestDtoMatchingAlgorithmEnumValues = new BuiltSet<
        CreateTagRequestDtoMatchingAlgorithmEnum>(const <CreateTagRequestDtoMatchingAlgorithmEnum>[
  _$createTagRequestDtoMatchingAlgorithmEnum_none,
  _$createTagRequestDtoMatchingAlgorithmEnum_any,
  _$createTagRequestDtoMatchingAlgorithmEnum_all,
  _$createTagRequestDtoMatchingAlgorithmEnum_exact,
  _$createTagRequestDtoMatchingAlgorithmEnum_regex,
]);

Serializer<CreateTagRequestDtoMatchingAlgorithmEnum>
    _$createTagRequestDtoMatchingAlgorithmEnumSerializer =
    new _$CreateTagRequestDtoMatchingAlgorithmEnumSerializer();

class _$CreateTagRequestDtoMatchingAlgorithmEnumSerializer
    implements PrimitiveSerializer<CreateTagRequestDtoMatchingAlgorithmEnum> {
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
    CreateTagRequestDtoMatchingAlgorithmEnum
  ];
  @override
  final String wireName = 'CreateTagRequestDtoMatchingAlgorithmEnum';

  @override
  Object serialize(Serializers serializers,
          CreateTagRequestDtoMatchingAlgorithmEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateTagRequestDtoMatchingAlgorithmEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateTagRequestDtoMatchingAlgorithmEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateTagRequestDto extends CreateTagRequestDto {
  @override
  final String name;
  @override
  final String? color;
  @override
  final bool? isInbox;
  @override
  final CreateTagRequestDtoMatchingAlgorithmEnum? matchingAlgorithm;
  @override
  final String? match;

  factory _$CreateTagRequestDto(
          [void Function(CreateTagRequestDtoBuilder)? updates]) =>
      (new CreateTagRequestDtoBuilder()..update(updates))._build();

  _$CreateTagRequestDto._(
      {required this.name,
      this.color,
      this.isInbox,
      this.matchingAlgorithm,
      this.match})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(name, r'CreateTagRequestDto', 'name');
  }

  @override
  CreateTagRequestDto rebuild(
          void Function(CreateTagRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateTagRequestDtoBuilder toBuilder() =>
      new CreateTagRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateTagRequestDto &&
        name == other.name &&
        color == other.color &&
        isInbox == other.isInbox &&
        matchingAlgorithm == other.matchingAlgorithm &&
        match == other.match;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, color.hashCode);
    _$hash = $jc(_$hash, isInbox.hashCode);
    _$hash = $jc(_$hash, matchingAlgorithm.hashCode);
    _$hash = $jc(_$hash, match.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateTagRequestDto')
          ..add('name', name)
          ..add('color', color)
          ..add('isInbox', isInbox)
          ..add('matchingAlgorithm', matchingAlgorithm)
          ..add('match', match))
        .toString();
  }
}

class CreateTagRequestDtoBuilder
    implements Builder<CreateTagRequestDto, CreateTagRequestDtoBuilder> {
  _$CreateTagRequestDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _color;
  String? get color => _$this._color;
  set color(String? color) => _$this._color = color;

  bool? _isInbox;
  bool? get isInbox => _$this._isInbox;
  set isInbox(bool? isInbox) => _$this._isInbox = isInbox;

  CreateTagRequestDtoMatchingAlgorithmEnum? _matchingAlgorithm;
  CreateTagRequestDtoMatchingAlgorithmEnum? get matchingAlgorithm =>
      _$this._matchingAlgorithm;
  set matchingAlgorithm(
          CreateTagRequestDtoMatchingAlgorithmEnum? matchingAlgorithm) =>
      _$this._matchingAlgorithm = matchingAlgorithm;

  String? _match;
  String? get match => _$this._match;
  set match(String? match) => _$this._match = match;

  CreateTagRequestDtoBuilder() {
    CreateTagRequestDto._defaults(this);
  }

  CreateTagRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _color = $v.color;
      _isInbox = $v.isInbox;
      _matchingAlgorithm = $v.matchingAlgorithm;
      _match = $v.match;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateTagRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CreateTagRequestDto;
  }

  @override
  void update(void Function(CreateTagRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateTagRequestDto build() => _build();

  _$CreateTagRequestDto _build() {
    final _$result = _$v ??
        new _$CreateTagRequestDto._(
            name: BuiltValueNullFieldError.checkNotNull(
                name, r'CreateTagRequestDto', 'name'),
            color: color,
            isInbox: isInbox,
            matchingAlgorithm: matchingAlgorithm,
            match: match);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
