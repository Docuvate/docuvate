// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_tag_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UpdateTagRequestDtoMatchingAlgorithmEnum
    _$updateTagRequestDtoMatchingAlgorithmEnum_none =
    const UpdateTagRequestDtoMatchingAlgorithmEnum._('none');
const UpdateTagRequestDtoMatchingAlgorithmEnum
    _$updateTagRequestDtoMatchingAlgorithmEnum_any =
    const UpdateTagRequestDtoMatchingAlgorithmEnum._('any');
const UpdateTagRequestDtoMatchingAlgorithmEnum
    _$updateTagRequestDtoMatchingAlgorithmEnum_all =
    const UpdateTagRequestDtoMatchingAlgorithmEnum._('all');
const UpdateTagRequestDtoMatchingAlgorithmEnum
    _$updateTagRequestDtoMatchingAlgorithmEnum_exact =
    const UpdateTagRequestDtoMatchingAlgorithmEnum._('exact');
const UpdateTagRequestDtoMatchingAlgorithmEnum
    _$updateTagRequestDtoMatchingAlgorithmEnum_regex =
    const UpdateTagRequestDtoMatchingAlgorithmEnum._('regex');

UpdateTagRequestDtoMatchingAlgorithmEnum
    _$updateTagRequestDtoMatchingAlgorithmEnumValueOf(String name) {
  switch (name) {
    case 'none':
      return _$updateTagRequestDtoMatchingAlgorithmEnum_none;
    case 'any':
      return _$updateTagRequestDtoMatchingAlgorithmEnum_any;
    case 'all':
      return _$updateTagRequestDtoMatchingAlgorithmEnum_all;
    case 'exact':
      return _$updateTagRequestDtoMatchingAlgorithmEnum_exact;
    case 'regex':
      return _$updateTagRequestDtoMatchingAlgorithmEnum_regex;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<UpdateTagRequestDtoMatchingAlgorithmEnum>
    _$updateTagRequestDtoMatchingAlgorithmEnumValues = new BuiltSet<
        UpdateTagRequestDtoMatchingAlgorithmEnum>(const <UpdateTagRequestDtoMatchingAlgorithmEnum>[
  _$updateTagRequestDtoMatchingAlgorithmEnum_none,
  _$updateTagRequestDtoMatchingAlgorithmEnum_any,
  _$updateTagRequestDtoMatchingAlgorithmEnum_all,
  _$updateTagRequestDtoMatchingAlgorithmEnum_exact,
  _$updateTagRequestDtoMatchingAlgorithmEnum_regex,
]);

Serializer<UpdateTagRequestDtoMatchingAlgorithmEnum>
    _$updateTagRequestDtoMatchingAlgorithmEnumSerializer =
    new _$UpdateTagRequestDtoMatchingAlgorithmEnumSerializer();

class _$UpdateTagRequestDtoMatchingAlgorithmEnumSerializer
    implements PrimitiveSerializer<UpdateTagRequestDtoMatchingAlgorithmEnum> {
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
    UpdateTagRequestDtoMatchingAlgorithmEnum
  ];
  @override
  final String wireName = 'UpdateTagRequestDtoMatchingAlgorithmEnum';

  @override
  Object serialize(Serializers serializers,
          UpdateTagRequestDtoMatchingAlgorithmEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UpdateTagRequestDtoMatchingAlgorithmEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UpdateTagRequestDtoMatchingAlgorithmEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UpdateTagRequestDto extends UpdateTagRequestDto {
  @override
  final String? name;
  @override
  final String? color;
  @override
  final bool? isInbox;
  @override
  final UpdateTagRequestDtoMatchingAlgorithmEnum? matchingAlgorithm;
  @override
  final String? match;

  factory _$UpdateTagRequestDto(
          [void Function(UpdateTagRequestDtoBuilder)? updates]) =>
      (new UpdateTagRequestDtoBuilder()..update(updates))._build();

  _$UpdateTagRequestDto._(
      {this.name, this.color, this.isInbox, this.matchingAlgorithm, this.match})
      : super._();

  @override
  UpdateTagRequestDto rebuild(
          void Function(UpdateTagRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateTagRequestDtoBuilder toBuilder() =>
      new UpdateTagRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateTagRequestDto &&
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
    return (newBuiltValueToStringHelper(r'UpdateTagRequestDto')
          ..add('name', name)
          ..add('color', color)
          ..add('isInbox', isInbox)
          ..add('matchingAlgorithm', matchingAlgorithm)
          ..add('match', match))
        .toString();
  }
}

class UpdateTagRequestDtoBuilder
    implements Builder<UpdateTagRequestDto, UpdateTagRequestDtoBuilder> {
  _$UpdateTagRequestDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _color;
  String? get color => _$this._color;
  set color(String? color) => _$this._color = color;

  bool? _isInbox;
  bool? get isInbox => _$this._isInbox;
  set isInbox(bool? isInbox) => _$this._isInbox = isInbox;

  UpdateTagRequestDtoMatchingAlgorithmEnum? _matchingAlgorithm;
  UpdateTagRequestDtoMatchingAlgorithmEnum? get matchingAlgorithm =>
      _$this._matchingAlgorithm;
  set matchingAlgorithm(
          UpdateTagRequestDtoMatchingAlgorithmEnum? matchingAlgorithm) =>
      _$this._matchingAlgorithm = matchingAlgorithm;

  String? _match;
  String? get match => _$this._match;
  set match(String? match) => _$this._match = match;

  UpdateTagRequestDtoBuilder() {
    UpdateTagRequestDto._defaults(this);
  }

  UpdateTagRequestDtoBuilder get _$this {
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
  void replace(UpdateTagRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$UpdateTagRequestDto;
  }

  @override
  void update(void Function(UpdateTagRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateTagRequestDto build() => _build();

  _$UpdateTagRequestDto _build() {
    final _$result = _$v ??
        new _$UpdateTagRequestDto._(
            name: name,
            color: color,
            isInbox: isInbox,
            matchingAlgorithm: matchingAlgorithm,
            match: match);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
