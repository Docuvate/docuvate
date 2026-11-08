// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_region_table_row_role_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DocumentRegionTableRowRoleDtoRoleEnum
    _$documentRegionTableRowRoleDtoRoleEnum_section =
    const DocumentRegionTableRowRoleDtoRoleEnum._('section');
const DocumentRegionTableRowRoleDtoRoleEnum
    _$documentRegionTableRowRoleDtoRoleEnum_subtotal =
    const DocumentRegionTableRowRoleDtoRoleEnum._('subtotal');

DocumentRegionTableRowRoleDtoRoleEnum
    _$documentRegionTableRowRoleDtoRoleEnumValueOf(String name) {
  switch (name) {
    case 'section':
      return _$documentRegionTableRowRoleDtoRoleEnum_section;
    case 'subtotal':
      return _$documentRegionTableRowRoleDtoRoleEnum_subtotal;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<DocumentRegionTableRowRoleDtoRoleEnum>
    _$documentRegionTableRowRoleDtoRoleEnumValues = BuiltSet<
        DocumentRegionTableRowRoleDtoRoleEnum>(const <DocumentRegionTableRowRoleDtoRoleEnum>[
  _$documentRegionTableRowRoleDtoRoleEnum_section,
  _$documentRegionTableRowRoleDtoRoleEnum_subtotal,
]);

Serializer<DocumentRegionTableRowRoleDtoRoleEnum>
    _$documentRegionTableRowRoleDtoRoleEnumSerializer =
    _$DocumentRegionTableRowRoleDtoRoleEnumSerializer();

class _$DocumentRegionTableRowRoleDtoRoleEnumSerializer
    implements PrimitiveSerializer<DocumentRegionTableRowRoleDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'section': 'section',
    'subtotal': 'subtotal',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'section': 'section',
    'subtotal': 'subtotal',
  };

  @override
  final Iterable<Type> types = const <Type>[
    DocumentRegionTableRowRoleDtoRoleEnum
  ];
  @override
  final String wireName = 'DocumentRegionTableRowRoleDtoRoleEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentRegionTableRowRoleDtoRoleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentRegionTableRowRoleDtoRoleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentRegionTableRowRoleDtoRoleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentRegionTableRowRoleDto extends DocumentRegionTableRowRoleDto {
  @override
  final num row;
  @override
  final DocumentRegionTableRowRoleDtoRoleEnum role;

  factory _$DocumentRegionTableRowRoleDto(
          [void Function(DocumentRegionTableRowRoleDtoBuilder)? updates]) =>
      (DocumentRegionTableRowRoleDtoBuilder()..update(updates))._build();

  _$DocumentRegionTableRowRoleDto._({required this.row, required this.role})
      : super._();
  @override
  DocumentRegionTableRowRoleDto rebuild(
          void Function(DocumentRegionTableRowRoleDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentRegionTableRowRoleDtoBuilder toBuilder() =>
      DocumentRegionTableRowRoleDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentRegionTableRowRoleDto &&
        row == other.row &&
        role == other.role;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, row.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentRegionTableRowRoleDto')
          ..add('row', row)
          ..add('role', role))
        .toString();
  }
}

class DocumentRegionTableRowRoleDtoBuilder
    implements
        Builder<DocumentRegionTableRowRoleDto,
            DocumentRegionTableRowRoleDtoBuilder> {
  _$DocumentRegionTableRowRoleDto? _$v;

  num? _row;
  num? get row => _$this._row;
  set row(num? row) => _$this._row = row;

  DocumentRegionTableRowRoleDtoRoleEnum? _role;
  DocumentRegionTableRowRoleDtoRoleEnum? get role => _$this._role;
  set role(DocumentRegionTableRowRoleDtoRoleEnum? role) => _$this._role = role;

  DocumentRegionTableRowRoleDtoBuilder() {
    DocumentRegionTableRowRoleDto._defaults(this);
  }

  DocumentRegionTableRowRoleDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _row = $v.row;
      _role = $v.role;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentRegionTableRowRoleDto other) {
    _$v = other as _$DocumentRegionTableRowRoleDto;
  }

  @override
  void update(void Function(DocumentRegionTableRowRoleDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentRegionTableRowRoleDto build() => _build();

  _$DocumentRegionTableRowRoleDto _build() {
    final _$result = _$v ??
        _$DocumentRegionTableRowRoleDto._(
          row: BuiltValueNullFieldError.checkNotNull(
              row, r'DocumentRegionTableRowRoleDto', 'row'),
          role: BuiltValueNullFieldError.checkNotNull(
              role, r'DocumentRegionTableRowRoleDto', 'role'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
