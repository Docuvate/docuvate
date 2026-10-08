// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_thread_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DocumentChatThreadDtoScopeEnum _$documentChatThreadDtoScopeEnum_document =
    const DocumentChatThreadDtoScopeEnum._('document');
const DocumentChatThreadDtoScopeEnum _$documentChatThreadDtoScopeEnum_corpus =
    const DocumentChatThreadDtoScopeEnum._('corpus');

DocumentChatThreadDtoScopeEnum _$documentChatThreadDtoScopeEnumValueOf(
    String name) {
  switch (name) {
    case 'document':
      return _$documentChatThreadDtoScopeEnum_document;
    case 'corpus':
      return _$documentChatThreadDtoScopeEnum_corpus;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentChatThreadDtoScopeEnum>
    _$documentChatThreadDtoScopeEnumValues = new BuiltSet<
        DocumentChatThreadDtoScopeEnum>(const <DocumentChatThreadDtoScopeEnum>[
  _$documentChatThreadDtoScopeEnum_document,
  _$documentChatThreadDtoScopeEnum_corpus,
]);

const DocumentChatThreadDtoActiveGenerationStatusEnum
    _$documentChatThreadDtoActiveGenerationStatusEnum_failed =
    const DocumentChatThreadDtoActiveGenerationStatusEnum._('failed');
const DocumentChatThreadDtoActiveGenerationStatusEnum
    _$documentChatThreadDtoActiveGenerationStatusEnum_pending =
    const DocumentChatThreadDtoActiveGenerationStatusEnum._('pending');
const DocumentChatThreadDtoActiveGenerationStatusEnum
    _$documentChatThreadDtoActiveGenerationStatusEnum_streaming =
    const DocumentChatThreadDtoActiveGenerationStatusEnum._('streaming');
const DocumentChatThreadDtoActiveGenerationStatusEnum
    _$documentChatThreadDtoActiveGenerationStatusEnum_done =
    const DocumentChatThreadDtoActiveGenerationStatusEnum._('done');

DocumentChatThreadDtoActiveGenerationStatusEnum
    _$documentChatThreadDtoActiveGenerationStatusEnumValueOf(String name) {
  switch (name) {
    case 'failed':
      return _$documentChatThreadDtoActiveGenerationStatusEnum_failed;
    case 'pending':
      return _$documentChatThreadDtoActiveGenerationStatusEnum_pending;
    case 'streaming':
      return _$documentChatThreadDtoActiveGenerationStatusEnum_streaming;
    case 'done':
      return _$documentChatThreadDtoActiveGenerationStatusEnum_done;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentChatThreadDtoActiveGenerationStatusEnum>
    _$documentChatThreadDtoActiveGenerationStatusEnumValues = new BuiltSet<
        DocumentChatThreadDtoActiveGenerationStatusEnum>(const <DocumentChatThreadDtoActiveGenerationStatusEnum>[
  _$documentChatThreadDtoActiveGenerationStatusEnum_failed,
  _$documentChatThreadDtoActiveGenerationStatusEnum_pending,
  _$documentChatThreadDtoActiveGenerationStatusEnum_streaming,
  _$documentChatThreadDtoActiveGenerationStatusEnum_done,
]);

Serializer<DocumentChatThreadDtoScopeEnum>
    _$documentChatThreadDtoScopeEnumSerializer =
    new _$DocumentChatThreadDtoScopeEnumSerializer();
Serializer<DocumentChatThreadDtoActiveGenerationStatusEnum>
    _$documentChatThreadDtoActiveGenerationStatusEnumSerializer =
    new _$DocumentChatThreadDtoActiveGenerationStatusEnumSerializer();

class _$DocumentChatThreadDtoScopeEnumSerializer
    implements PrimitiveSerializer<DocumentChatThreadDtoScopeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'document': 'document',
    'corpus': 'corpus',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'document': 'document',
    'corpus': 'corpus',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentChatThreadDtoScopeEnum];
  @override
  final String wireName = 'DocumentChatThreadDtoScopeEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentChatThreadDtoScopeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentChatThreadDtoScopeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentChatThreadDtoScopeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentChatThreadDtoActiveGenerationStatusEnumSerializer
    implements
        PrimitiveSerializer<DocumentChatThreadDtoActiveGenerationStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'failed': 'failed',
    'pending': 'pending',
    'streaming': 'streaming',
    'done': 'done',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'failed': 'failed',
    'pending': 'pending',
    'streaming': 'streaming',
    'done': 'done',
  };

  @override
  final Iterable<Type> types = const <Type>[
    DocumentChatThreadDtoActiveGenerationStatusEnum
  ];
  @override
  final String wireName = 'DocumentChatThreadDtoActiveGenerationStatusEnum';

  @override
  Object serialize(Serializers serializers,
          DocumentChatThreadDtoActiveGenerationStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentChatThreadDtoActiveGenerationStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentChatThreadDtoActiveGenerationStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentChatThreadDto extends DocumentChatThreadDto {
  @override
  final String id;
  @override
  final String title;
  @override
  final DocumentChatThreadDtoScopeEnum scope;
  @override
  final BuiltList<String> documentIds;
  @override
  final String createdAt;
  @override
  final String updatedAt;
  @override
  final String? lastMessagePreview;
  @override
  final DocumentChatThreadDtoActiveGenerationStatusEnum? activeGenerationStatus;

  factory _$DocumentChatThreadDto(
          [void Function(DocumentChatThreadDtoBuilder)? updates]) =>
      (new DocumentChatThreadDtoBuilder()..update(updates))._build();

  _$DocumentChatThreadDto._(
      {required this.id,
      required this.title,
      required this.scope,
      required this.documentIds,
      required this.createdAt,
      required this.updatedAt,
      this.lastMessagePreview,
      this.activeGenerationStatus})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'DocumentChatThreadDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        title, r'DocumentChatThreadDto', 'title');
    BuiltValueNullFieldError.checkNotNull(
        scope, r'DocumentChatThreadDto', 'scope');
    BuiltValueNullFieldError.checkNotNull(
        documentIds, r'DocumentChatThreadDto', 'documentIds');
    BuiltValueNullFieldError.checkNotNull(
        createdAt, r'DocumentChatThreadDto', 'createdAt');
    BuiltValueNullFieldError.checkNotNull(
        updatedAt, r'DocumentChatThreadDto', 'updatedAt');
  }

  @override
  DocumentChatThreadDto rebuild(
          void Function(DocumentChatThreadDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatThreadDtoBuilder toBuilder() =>
      new DocumentChatThreadDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatThreadDto &&
        id == other.id &&
        title == other.title &&
        scope == other.scope &&
        documentIds == other.documentIds &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        lastMessagePreview == other.lastMessagePreview &&
        activeGenerationStatus == other.activeGenerationStatus;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, scope.hashCode);
    _$hash = $jc(_$hash, documentIds.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, lastMessagePreview.hashCode);
    _$hash = $jc(_$hash, activeGenerationStatus.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentChatThreadDto')
          ..add('id', id)
          ..add('title', title)
          ..add('scope', scope)
          ..add('documentIds', documentIds)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('lastMessagePreview', lastMessagePreview)
          ..add('activeGenerationStatus', activeGenerationStatus))
        .toString();
  }
}

class DocumentChatThreadDtoBuilder
    implements Builder<DocumentChatThreadDto, DocumentChatThreadDtoBuilder> {
  _$DocumentChatThreadDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  DocumentChatThreadDtoScopeEnum? _scope;
  DocumentChatThreadDtoScopeEnum? get scope => _$this._scope;
  set scope(DocumentChatThreadDtoScopeEnum? scope) => _$this._scope = scope;

  ListBuilder<String>? _documentIds;
  ListBuilder<String> get documentIds =>
      _$this._documentIds ??= new ListBuilder<String>();
  set documentIds(ListBuilder<String>? documentIds) =>
      _$this._documentIds = documentIds;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  String? _lastMessagePreview;
  String? get lastMessagePreview => _$this._lastMessagePreview;
  set lastMessagePreview(String? lastMessagePreview) =>
      _$this._lastMessagePreview = lastMessagePreview;

  DocumentChatThreadDtoActiveGenerationStatusEnum? _activeGenerationStatus;
  DocumentChatThreadDtoActiveGenerationStatusEnum? get activeGenerationStatus =>
      _$this._activeGenerationStatus;
  set activeGenerationStatus(
          DocumentChatThreadDtoActiveGenerationStatusEnum?
              activeGenerationStatus) =>
      _$this._activeGenerationStatus = activeGenerationStatus;

  DocumentChatThreadDtoBuilder() {
    DocumentChatThreadDto._defaults(this);
  }

  DocumentChatThreadDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _title = $v.title;
      _scope = $v.scope;
      _documentIds = $v.documentIds.toBuilder();
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _lastMessagePreview = $v.lastMessagePreview;
      _activeGenerationStatus = $v.activeGenerationStatus;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatThreadDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentChatThreadDto;
  }

  @override
  void update(void Function(DocumentChatThreadDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatThreadDto build() => _build();

  _$DocumentChatThreadDto _build() {
    _$DocumentChatThreadDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentChatThreadDto._(
              id: BuiltValueNullFieldError.checkNotNull(
                  id, r'DocumentChatThreadDto', 'id'),
              title: BuiltValueNullFieldError.checkNotNull(
                  title, r'DocumentChatThreadDto', 'title'),
              scope: BuiltValueNullFieldError.checkNotNull(
                  scope, r'DocumentChatThreadDto', 'scope'),
              documentIds: documentIds.build(),
              createdAt: BuiltValueNullFieldError.checkNotNull(
                  createdAt, r'DocumentChatThreadDto', 'createdAt'),
              updatedAt: BuiltValueNullFieldError.checkNotNull(
                  updatedAt, r'DocumentChatThreadDto', 'updatedAt'),
              lastMessagePreview: lastMessagePreview,
              activeGenerationStatus: activeGenerationStatus);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'documentIds';
        documentIds.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentChatThreadDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
