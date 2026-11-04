// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_correction_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DocumentCorrectionDtoKindEnum _$documentCorrectionDtoKindEnum_label =
    const DocumentCorrectionDtoKindEnum._('label');
const DocumentCorrectionDtoKindEnum _$documentCorrectionDtoKindEnum_field =
    const DocumentCorrectionDtoKindEnum._('field');
const DocumentCorrectionDtoKindEnum _$documentCorrectionDtoKindEnum_table =
    const DocumentCorrectionDtoKindEnum._('table');
const DocumentCorrectionDtoKindEnum _$documentCorrectionDtoKindEnum_block =
    const DocumentCorrectionDtoKindEnum._('block');

DocumentCorrectionDtoKindEnum _$documentCorrectionDtoKindEnumValueOf(
    String name) {
  switch (name) {
    case 'label':
      return _$documentCorrectionDtoKindEnum_label;
    case 'field':
      return _$documentCorrectionDtoKindEnum_field;
    case 'table':
      return _$documentCorrectionDtoKindEnum_table;
    case 'block':
      return _$documentCorrectionDtoKindEnum_block;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentCorrectionDtoKindEnum>
    _$documentCorrectionDtoKindEnumValues = new BuiltSet<
        DocumentCorrectionDtoKindEnum>(const <DocumentCorrectionDtoKindEnum>[
  _$documentCorrectionDtoKindEnum_label,
  _$documentCorrectionDtoKindEnum_field,
  _$documentCorrectionDtoKindEnum_table,
  _$documentCorrectionDtoKindEnum_block,
]);

const DocumentCorrectionDtoStatusEnum _$documentCorrectionDtoStatusEnum_active =
    const DocumentCorrectionDtoStatusEnum._('active');
const DocumentCorrectionDtoStatusEnum
    _$documentCorrectionDtoStatusEnum_withdrawn =
    const DocumentCorrectionDtoStatusEnum._('withdrawn');

DocumentCorrectionDtoStatusEnum _$documentCorrectionDtoStatusEnumValueOf(
    String name) {
  switch (name) {
    case 'active':
      return _$documentCorrectionDtoStatusEnum_active;
    case 'withdrawn':
      return _$documentCorrectionDtoStatusEnum_withdrawn;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentCorrectionDtoStatusEnum>
    _$documentCorrectionDtoStatusEnumValues = new BuiltSet<
        DocumentCorrectionDtoStatusEnum>(const <DocumentCorrectionDtoStatusEnum>[
  _$documentCorrectionDtoStatusEnum_active,
  _$documentCorrectionDtoStatusEnum_withdrawn,
]);

Serializer<DocumentCorrectionDtoKindEnum>
    _$documentCorrectionDtoKindEnumSerializer =
    new _$DocumentCorrectionDtoKindEnumSerializer();
Serializer<DocumentCorrectionDtoStatusEnum>
    _$documentCorrectionDtoStatusEnumSerializer =
    new _$DocumentCorrectionDtoStatusEnumSerializer();

class _$DocumentCorrectionDtoKindEnumSerializer
    implements PrimitiveSerializer<DocumentCorrectionDtoKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'label': 'label',
    'field': 'field',
    'table': 'table',
    'block': 'block',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'label': 'label',
    'field': 'field',
    'table': 'table',
    'block': 'block',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentCorrectionDtoKindEnum];
  @override
  final String wireName = 'DocumentCorrectionDtoKindEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentCorrectionDtoKindEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentCorrectionDtoKindEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentCorrectionDtoKindEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentCorrectionDtoStatusEnumSerializer
    implements PrimitiveSerializer<DocumentCorrectionDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'active': 'active',
    'withdrawn': 'withdrawn',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'active': 'active',
    'withdrawn': 'withdrawn',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentCorrectionDtoStatusEnum];
  @override
  final String wireName = 'DocumentCorrectionDtoStatusEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentCorrectionDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentCorrectionDtoStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentCorrectionDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentCorrectionDto extends DocumentCorrectionDto {
  @override
  final String id;
  @override
  final String documentId;
  @override
  final DocumentCorrectionDtoKindEnum kind;
  @override
  final DocumentCorrectionDtoStatusEnum status;
  @override
  final String op;
  @override
  final String fieldKey;
  @override
  final String beforeRegionId;
  @override
  final String afterRegionId;
  @override
  final String oldValue;
  @override
  final String newValue;
  @override
  final String createdAt;

  factory _$DocumentCorrectionDto(
          [void Function(DocumentCorrectionDtoBuilder)? updates]) =>
      (new DocumentCorrectionDtoBuilder()..update(updates))._build();

  _$DocumentCorrectionDto._(
      {required this.id,
      required this.documentId,
      required this.kind,
      required this.status,
      required this.op,
      required this.fieldKey,
      required this.beforeRegionId,
      required this.afterRegionId,
      required this.oldValue,
      required this.newValue,
      required this.createdAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'DocumentCorrectionDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        documentId, r'DocumentCorrectionDto', 'documentId');
    BuiltValueNullFieldError.checkNotNull(
        kind, r'DocumentCorrectionDto', 'kind');
    BuiltValueNullFieldError.checkNotNull(
        status, r'DocumentCorrectionDto', 'status');
    BuiltValueNullFieldError.checkNotNull(op, r'DocumentCorrectionDto', 'op');
    BuiltValueNullFieldError.checkNotNull(
        fieldKey, r'DocumentCorrectionDto', 'fieldKey');
    BuiltValueNullFieldError.checkNotNull(
        beforeRegionId, r'DocumentCorrectionDto', 'beforeRegionId');
    BuiltValueNullFieldError.checkNotNull(
        afterRegionId, r'DocumentCorrectionDto', 'afterRegionId');
    BuiltValueNullFieldError.checkNotNull(
        oldValue, r'DocumentCorrectionDto', 'oldValue');
    BuiltValueNullFieldError.checkNotNull(
        newValue, r'DocumentCorrectionDto', 'newValue');
    BuiltValueNullFieldError.checkNotNull(
        createdAt, r'DocumentCorrectionDto', 'createdAt');
  }

  @override
  DocumentCorrectionDto rebuild(
          void Function(DocumentCorrectionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentCorrectionDtoBuilder toBuilder() =>
      new DocumentCorrectionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentCorrectionDto &&
        id == other.id &&
        documentId == other.documentId &&
        kind == other.kind &&
        status == other.status &&
        op == other.op &&
        fieldKey == other.fieldKey &&
        beforeRegionId == other.beforeRegionId &&
        afterRegionId == other.afterRegionId &&
        oldValue == other.oldValue &&
        newValue == other.newValue &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, documentId.hashCode);
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, op.hashCode);
    _$hash = $jc(_$hash, fieldKey.hashCode);
    _$hash = $jc(_$hash, beforeRegionId.hashCode);
    _$hash = $jc(_$hash, afterRegionId.hashCode);
    _$hash = $jc(_$hash, oldValue.hashCode);
    _$hash = $jc(_$hash, newValue.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentCorrectionDto')
          ..add('id', id)
          ..add('documentId', documentId)
          ..add('kind', kind)
          ..add('status', status)
          ..add('op', op)
          ..add('fieldKey', fieldKey)
          ..add('beforeRegionId', beforeRegionId)
          ..add('afterRegionId', afterRegionId)
          ..add('oldValue', oldValue)
          ..add('newValue', newValue)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class DocumentCorrectionDtoBuilder
    implements Builder<DocumentCorrectionDto, DocumentCorrectionDtoBuilder> {
  _$DocumentCorrectionDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _documentId;
  String? get documentId => _$this._documentId;
  set documentId(String? documentId) => _$this._documentId = documentId;

  DocumentCorrectionDtoKindEnum? _kind;
  DocumentCorrectionDtoKindEnum? get kind => _$this._kind;
  set kind(DocumentCorrectionDtoKindEnum? kind) => _$this._kind = kind;

  DocumentCorrectionDtoStatusEnum? _status;
  DocumentCorrectionDtoStatusEnum? get status => _$this._status;
  set status(DocumentCorrectionDtoStatusEnum? status) =>
      _$this._status = status;

  String? _op;
  String? get op => _$this._op;
  set op(String? op) => _$this._op = op;

  String? _fieldKey;
  String? get fieldKey => _$this._fieldKey;
  set fieldKey(String? fieldKey) => _$this._fieldKey = fieldKey;

  String? _beforeRegionId;
  String? get beforeRegionId => _$this._beforeRegionId;
  set beforeRegionId(String? beforeRegionId) =>
      _$this._beforeRegionId = beforeRegionId;

  String? _afterRegionId;
  String? get afterRegionId => _$this._afterRegionId;
  set afterRegionId(String? afterRegionId) =>
      _$this._afterRegionId = afterRegionId;

  String? _oldValue;
  String? get oldValue => _$this._oldValue;
  set oldValue(String? oldValue) => _$this._oldValue = oldValue;

  String? _newValue;
  String? get newValue => _$this._newValue;
  set newValue(String? newValue) => _$this._newValue = newValue;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  DocumentCorrectionDtoBuilder() {
    DocumentCorrectionDto._defaults(this);
  }

  DocumentCorrectionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _documentId = $v.documentId;
      _kind = $v.kind;
      _status = $v.status;
      _op = $v.op;
      _fieldKey = $v.fieldKey;
      _beforeRegionId = $v.beforeRegionId;
      _afterRegionId = $v.afterRegionId;
      _oldValue = $v.oldValue;
      _newValue = $v.newValue;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentCorrectionDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentCorrectionDto;
  }

  @override
  void update(void Function(DocumentCorrectionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentCorrectionDto build() => _build();

  _$DocumentCorrectionDto _build() {
    final _$result = _$v ??
        new _$DocumentCorrectionDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'DocumentCorrectionDto', 'id'),
            documentId: BuiltValueNullFieldError.checkNotNull(
                documentId, r'DocumentCorrectionDto', 'documentId'),
            kind: BuiltValueNullFieldError.checkNotNull(
                kind, r'DocumentCorrectionDto', 'kind'),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'DocumentCorrectionDto', 'status'),
            op: BuiltValueNullFieldError.checkNotNull(
                op, r'DocumentCorrectionDto', 'op'),
            fieldKey: BuiltValueNullFieldError.checkNotNull(
                fieldKey, r'DocumentCorrectionDto', 'fieldKey'),
            beforeRegionId: BuiltValueNullFieldError.checkNotNull(
                beforeRegionId, r'DocumentCorrectionDto', 'beforeRegionId'),
            afterRegionId: BuiltValueNullFieldError.checkNotNull(
                afterRegionId, r'DocumentCorrectionDto', 'afterRegionId'),
            oldValue: BuiltValueNullFieldError.checkNotNull(
                oldValue, r'DocumentCorrectionDto', 'oldValue'),
            newValue: BuiltValueNullFieldError.checkNotNull(newValue, r'DocumentCorrectionDto', 'newValue'),
            createdAt: BuiltValueNullFieldError.checkNotNull(createdAt, r'DocumentCorrectionDto', 'createdAt'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
