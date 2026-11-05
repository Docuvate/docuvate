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
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentRegionTableRuleDtoAxisEnum>
    _$documentRegionTableRuleDtoAxisEnumValues = new BuiltSet<
        DocumentRegionTableRuleDtoAxisEnum>(const <DocumentRegionTableRuleDtoAxisEnum>[
  _$documentRegionTableRuleDtoAxisEnum_row,
  _$documentRegionTableRuleDtoAxisEnum_col,
]);

Serializer<DocumentRegionTableRuleDtoAxisEnum>
    _$documentRegionTableRuleDtoAxisEnumSerializer =
    new _$DocumentRegionTableRuleDtoAxisEnumSerializer();

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

class _$DocumentRegionTableRuleDto extends DocumentRegionTableRuleDto {
  @override
  final DocumentRegionTableRuleDtoAxisEnum axis;
  @override
  final num ord;
  @override
  final num pos;

  factory _$DocumentRegionTableRuleDto(
          [void Function(DocumentRegionTableRuleDtoBuilder)? updates]) =>
      (new DocumentRegionTableRuleDtoBuilder()..update(updates))._build();

  _$DocumentRegionTableRuleDto._(
      {required this.axis, required this.ord, required this.pos})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        axis, r'DocumentRegionTableRuleDto', 'axis');
    BuiltValueNullFieldError.checkNotNull(
        ord, r'DocumentRegionTableRuleDto', 'ord');
    BuiltValueNullFieldError.checkNotNull(
        pos, r'DocumentRegionTableRuleDto', 'pos');
  }

  @override
  DocumentRegionTableRuleDto rebuild(
          void Function(DocumentRegionTableRuleDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentRegionTableRuleDtoBuilder toBuilder() =>
      new DocumentRegionTableRuleDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentRegionTableRuleDto &&
        axis == other.axis &&
        ord == other.ord &&
        pos == other.pos;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, axis.hashCode);
    _$hash = $jc(_$hash, ord.hashCode);
    _$hash = $jc(_$hash, pos.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentRegionTableRuleDto')
          ..add('axis', axis)
          ..add('ord', ord)
          ..add('pos', pos))
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

  DocumentRegionTableRuleDtoBuilder() {
    DocumentRegionTableRuleDto._defaults(this);
  }

  DocumentRegionTableRuleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _axis = $v.axis;
      _ord = $v.ord;
      _pos = $v.pos;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentRegionTableRuleDto other) {
    ArgumentError.checkNotNull(other, 'other');
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
        new _$DocumentRegionTableRuleDto._(
            axis: BuiltValueNullFieldError.checkNotNull(
                axis, r'DocumentRegionTableRuleDto', 'axis'),
            ord: BuiltValueNullFieldError.checkNotNull(
                ord, r'DocumentRegionTableRuleDto', 'ord'),
            pos: BuiltValueNullFieldError.checkNotNull(
                pos, r'DocumentRegionTableRuleDto', 'pos'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
