// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_bulk_action_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DocumentBulkActionDtoActionEnum _$documentBulkActionDtoActionEnum_addTag =
    const DocumentBulkActionDtoActionEnum._('addTag');
const DocumentBulkActionDtoActionEnum
    _$documentBulkActionDtoActionEnum_removeTag =
    const DocumentBulkActionDtoActionEnum._('removeTag');
const DocumentBulkActionDtoActionEnum
    _$documentBulkActionDtoActionEnum_setCorrespondent =
    const DocumentBulkActionDtoActionEnum._('setCorrespondent');
const DocumentBulkActionDtoActionEnum
    _$documentBulkActionDtoActionEnum_setFolder =
    const DocumentBulkActionDtoActionEnum._('setFolder');
const DocumentBulkActionDtoActionEnum _$documentBulkActionDtoActionEnum_delete =
    const DocumentBulkActionDtoActionEnum._('delete');

DocumentBulkActionDtoActionEnum _$documentBulkActionDtoActionEnumValueOf(
    String name) {
  switch (name) {
    case 'addTag':
      return _$documentBulkActionDtoActionEnum_addTag;
    case 'removeTag':
      return _$documentBulkActionDtoActionEnum_removeTag;
    case 'setCorrespondent':
      return _$documentBulkActionDtoActionEnum_setCorrespondent;
    case 'setFolder':
      return _$documentBulkActionDtoActionEnum_setFolder;
    case 'delete':
      return _$documentBulkActionDtoActionEnum_delete;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentBulkActionDtoActionEnum>
    _$documentBulkActionDtoActionEnumValues = new BuiltSet<
        DocumentBulkActionDtoActionEnum>(const <DocumentBulkActionDtoActionEnum>[
  _$documentBulkActionDtoActionEnum_addTag,
  _$documentBulkActionDtoActionEnum_removeTag,
  _$documentBulkActionDtoActionEnum_setCorrespondent,
  _$documentBulkActionDtoActionEnum_setFolder,
  _$documentBulkActionDtoActionEnum_delete,
]);

Serializer<DocumentBulkActionDtoActionEnum>
    _$documentBulkActionDtoActionEnumSerializer =
    new _$DocumentBulkActionDtoActionEnumSerializer();

class _$DocumentBulkActionDtoActionEnumSerializer
    implements PrimitiveSerializer<DocumentBulkActionDtoActionEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'addTag': 'addTag',
    'removeTag': 'removeTag',
    'setCorrespondent': 'setCorrespondent',
    'setFolder': 'setFolder',
    'delete': 'delete',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'addTag': 'addTag',
    'removeTag': 'removeTag',
    'setCorrespondent': 'setCorrespondent',
    'setFolder': 'setFolder',
    'delete': 'delete',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentBulkActionDtoActionEnum];
  @override
  final String wireName = 'DocumentBulkActionDtoActionEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentBulkActionDtoActionEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentBulkActionDtoActionEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentBulkActionDtoActionEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentBulkActionDto extends DocumentBulkActionDto {
  @override
  final DocumentBulkActionDtoActionEnum action;
  @override
  final String? tagId;
  @override
  final String? correspondentId;
  @override
  final String? folderId;

  factory _$DocumentBulkActionDto(
          [void Function(DocumentBulkActionDtoBuilder)? updates]) =>
      (new DocumentBulkActionDtoBuilder()..update(updates))._build();

  _$DocumentBulkActionDto._(
      {required this.action, this.tagId, this.correspondentId, this.folderId})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        action, r'DocumentBulkActionDto', 'action');
  }

  @override
  DocumentBulkActionDto rebuild(
          void Function(DocumentBulkActionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentBulkActionDtoBuilder toBuilder() =>
      new DocumentBulkActionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentBulkActionDto &&
        action == other.action &&
        tagId == other.tagId &&
        correspondentId == other.correspondentId &&
        folderId == other.folderId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, action.hashCode);
    _$hash = $jc(_$hash, tagId.hashCode);
    _$hash = $jc(_$hash, correspondentId.hashCode);
    _$hash = $jc(_$hash, folderId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentBulkActionDto')
          ..add('action', action)
          ..add('tagId', tagId)
          ..add('correspondentId', correspondentId)
          ..add('folderId', folderId))
        .toString();
  }
}

class DocumentBulkActionDtoBuilder
    implements Builder<DocumentBulkActionDto, DocumentBulkActionDtoBuilder> {
  _$DocumentBulkActionDto? _$v;

  DocumentBulkActionDtoActionEnum? _action;
  DocumentBulkActionDtoActionEnum? get action => _$this._action;
  set action(DocumentBulkActionDtoActionEnum? action) =>
      _$this._action = action;

  String? _tagId;
  String? get tagId => _$this._tagId;
  set tagId(String? tagId) => _$this._tagId = tagId;

  String? _correspondentId;
  String? get correspondentId => _$this._correspondentId;
  set correspondentId(String? correspondentId) =>
      _$this._correspondentId = correspondentId;

  String? _folderId;
  String? get folderId => _$this._folderId;
  set folderId(String? folderId) => _$this._folderId = folderId;

  DocumentBulkActionDtoBuilder() {
    DocumentBulkActionDto._defaults(this);
  }

  DocumentBulkActionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _action = $v.action;
      _tagId = $v.tagId;
      _correspondentId = $v.correspondentId;
      _folderId = $v.folderId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentBulkActionDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentBulkActionDto;
  }

  @override
  void update(void Function(DocumentBulkActionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentBulkActionDto build() => _build();

  _$DocumentBulkActionDto _build() {
    final _$result = _$v ??
        new _$DocumentBulkActionDto._(
            action: BuiltValueNullFieldError.checkNotNull(
                action, r'DocumentBulkActionDto', 'action'),
            tagId: tagId,
            correspondentId: correspondentId,
            folderId: folderId);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
