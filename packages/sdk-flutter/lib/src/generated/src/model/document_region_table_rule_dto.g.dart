// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_region_table_rule_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DocumentRegionTableRuleDtoAxisEnum
    _$documentRegionTableRuleDtoAxisEnum_row =
    const DocumentRegionTableRuleDtoAxisEnum._('row');
const DocumentRegionTableRuleDtoAxisEnum
    _$documentRegionTableRuleDtoAxisEnum_col =
    const DocumentRegionTableRuleDtoAxisEnum._('col');

DocumentRegionTableRuleDtoAxisEnum _$documentRegionTableRuleDtoAxisEnumValueOf(
    String name) {
  switch (name) {
    case 'row':
      return _$documentRegionTableRuleDtoAxisEnum_row;
    case 'col':
      return _$documentRegionTableRuleDtoAxisEnum_col;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<DocumentRegionTableRuleDtoAxisEnum>
    _$documentRegionTableRuleDtoAxisEnumValues = BuiltSet<
        DocumentRegionTableRuleDtoAxisEnum>(const <DocumentRegionTableRuleDtoAxisEnum>[
  _$documentRegionTableRuleDtoAxisEnum_row,
  _$documentRegionTableRuleDtoAxisEnum_col,
]);

const DocumentRegionTableRuleDtoLineEnum
    _$documentRegionTableRuleDtoLineEnum_unknown =
    const DocumentRegionTableRuleDtoLineEnum._('unknown');
const DocumentRegionTableRuleDtoLineEnum
    _$documentRegionTableRuleDtoLineEnum_none =
    const DocumentRegionTableRuleDtoLineEnum._('none');
const DocumentRegionTableRuleDtoLineEnum
    _$documentRegionTableRuleDtoLineEnum_thin =
    const DocumentRegionTableRuleDtoLineEnum._('thin');
const DocumentRegionTableRuleDtoLineEnum
    _$documentRegionTableRuleDtoLineEnum_thick =
    const DocumentRegionTableRuleDtoLineEnum._('thick');
const DocumentRegionTableRuleDtoLineEnum
    _$documentRegionTableRuleDtoLineEnum_double_ =
    const DocumentRegionTableRuleDtoLineEnum._('double_');

DocumentRegionTableRuleDtoLineEnum _$documentRegionTableRuleDtoLineEnumValueOf(
    String name) {
  switch (name) {
    case 'unknown':
      return _$documentRegionTableRuleDtoLineEnum_unknown;
    case 'none':
      return _$documentRegionTableRuleDtoLineEnum_none;
    case 'thin':
      return _$documentRegionTableRuleDtoLineEnum_thin;
    case 'thick':
      return _$documentRegionTableRuleDtoLineEnum_thick;
    case 'double_':
      return _$documentRegionTableRuleDtoLineEnum_double_;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<DocumentRegionTableRuleDtoLineEnum>
    _$documentRegionTableRuleDtoLineEnumValues = BuiltSet<
        DocumentRegionTableRuleDtoLineEnum>(const <DocumentRegionTableRuleDtoLineEnum>[
  _$documentRegionTableRuleDtoLineEnum_unknown,
  _$documentRegionTableRuleDtoLineEnum_none,
  _$documentRegionTableRuleDtoLineEnum_thin,
  _$documentRegionTableRuleDtoLineEnum_thick,
  _$documentRegionTableRuleDtoLineEnum_double_,
]);

Serializer<DocumentRegionTableRuleDtoAxisEnum>
    _$documentRegionTableRuleDtoAxisEnumSerializer =
    _$DocumentRegionTableRuleDtoAxisEnumSerializer();
Serializer<DocumentRegionTableRuleDtoLineEnum>
    _$documentRegionTableRuleDtoLineEnumSerializer =
    _$DocumentRegionTableRuleDtoLineEnumSerializer();

class _$DocumentRegionTableRuleDtoAxisEnumSerializer
    implements PrimitiveSerializer<DocumentRegionTableRuleDtoAxisEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'row': 'row',
    'col': 'col',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'row': 'row',
    'col': 'col',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentRegionTableRuleDtoAxisEnum];
  @override
  final String wireName = 'DocumentRegionTableRuleDtoAxisEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentRegionTableRuleDtoAxisEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentRegionTableRuleDtoAxisEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentRegionTableRuleDtoAxisEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentRegionTableRuleDtoLineEnumSerializer
    implements PrimitiveSerializer<DocumentRegionTableRuleDtoLineEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'unknown': 'unknown',
    'none': 'none',
    'thin': 'thin',
    'thick': 'thick',
    'double_': 'double',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'unknown': 'unknown',
    'none': 'none',
    'thin': 'thin',
    'thick': 'thick',
    'double': 'double_',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentRegionTableRuleDtoLineEnum];
  @override
  final String wireName = 'DocumentRegionTableRuleDtoLineEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentRegionTableRuleDtoLineEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentRegionTableRuleDtoLineEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentRegionTableRuleDtoLineEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentRegionTableRuleDto extends DocumentRegionTableRuleDto {
  @override
  final DocumentRegionTableRuleDtoAxisEnum axis;
  @override
  final num ord;
  @override
  final num pos;
  @override
  final DocumentRegionTableRuleDtoLineEnum line;

  factory _$DocumentRegionTableRuleDto(
          [void Function(DocumentRegionTableRuleDtoBuilder)? updates]) =>
      (DocumentRegionTableRuleDtoBuilder()..update(updates))._build();

  _$DocumentRegionTableRuleDto._(
      {required this.axis,
      required this.ord,
      required this.pos,
      required this.line})
      : super._();
  @override
  DocumentRegionTableRuleDto rebuild(
          void Function(DocumentRegionTableRuleDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentRegionTableRuleDtoBuilder toBuilder() =>
      DocumentRegionTableRuleDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentRegionTableRuleDto &&
        axis == other.axis &&
        ord == other.ord &&
        pos == other.pos &&
        line == other.line;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, axis.hashCode);
    _$hash = $jc(_$hash, ord.hashCode);
    _$hash = $jc(_$hash, pos.hashCode);
    _$hash = $jc(_$hash, line.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentRegionTableRuleDto')
          ..add('axis', axis)
          ..add('ord', ord)
          ..add('pos', pos)
          ..add('line', line))
        .toString();
  }
}

class DocumentRegionTableRuleDtoBuilder
    implements
        Builder<DocumentRegionTableRuleDto, DocumentRegionTableRuleDtoBuilder> {
  _$DocumentRegionTableRuleDto? _$v;

  DocumentRegionTableRuleDtoAxisEnum? _axis;
  DocumentRegionTableRuleDtoAxisEnum? get axis => _$this._axis;
  set axis(DocumentRegionTableRuleDtoAxisEnum? axis) => _$this._axis = axis;

  num? _ord;
  num? get ord => _$this._ord;
  set ord(num? ord) => _$this._ord = ord;

  num? _pos;
  num? get pos => _$this._pos;
  set pos(num? pos) => _$this._pos = pos;

  DocumentRegionTableRuleDtoLineEnum? _line;
  DocumentRegionTableRuleDtoLineEnum? get line => _$this._line;
  set line(DocumentRegionTableRuleDtoLineEnum? line) => _$this._line = line;

  DocumentRegionTableRuleDtoBuilder() {
    DocumentRegionTableRuleDto._defaults(this);
  }

  DocumentRegionTableRuleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _axis = $v.axis;
      _ord = $v.ord;
      _pos = $v.pos;
      _line = $v.line;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentRegionTableRuleDto other) {
    _$v = other as _$DocumentRegionTableRuleDto;
  }

  @override
  void update(void Function(DocumentRegionTableRuleDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentRegionTableRuleDto build() => _build();

  _$DocumentRegionTableRuleDto _build() {
    final _$result = _$v ??
        _$DocumentRegionTableRuleDto._(
          axis: BuiltValueNullFieldError.checkNotNull(
              axis, r'DocumentRegionTableRuleDto', 'axis'),
          ord: BuiltValueNullFieldError.checkNotNull(
              ord, r'DocumentRegionTableRuleDto', 'ord'),
          pos: BuiltValueNullFieldError.checkNotNull(
              pos, r'DocumentRegionTableRuleDto', 'pos'),
          line: BuiltValueNullFieldError.checkNotNull(
              line, r'DocumentRegionTableRuleDto', 'line'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
