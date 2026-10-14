// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DocumentResponseDtoStatusEnum _$documentResponseDtoStatusEnum_uploaded =
    const DocumentResponseDtoStatusEnum._('uploaded');
const DocumentResponseDtoStatusEnum _$documentResponseDtoStatusEnum_queued =
    const DocumentResponseDtoStatusEnum._('queued');
const DocumentResponseDtoStatusEnum _$documentResponseDtoStatusEnum_extracting =
    const DocumentResponseDtoStatusEnum._('extracting');
const DocumentResponseDtoStatusEnum _$documentResponseDtoStatusEnum_ready =
    const DocumentResponseDtoStatusEnum._('ready');
const DocumentResponseDtoStatusEnum _$documentResponseDtoStatusEnum_failed =
    const DocumentResponseDtoStatusEnum._('failed');

DocumentResponseDtoStatusEnum _$documentResponseDtoStatusEnumValueOf(
    String name) {
  switch (name) {
    case 'uploaded':
      return _$documentResponseDtoStatusEnum_uploaded;
    case 'queued':
      return _$documentResponseDtoStatusEnum_queued;
    case 'extracting':
      return _$documentResponseDtoStatusEnum_extracting;
    case 'ready':
      return _$documentResponseDtoStatusEnum_ready;
    case 'failed':
      return _$documentResponseDtoStatusEnum_failed;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<DocumentResponseDtoStatusEnum>
    _$documentResponseDtoStatusEnumValues = BuiltSet<
        DocumentResponseDtoStatusEnum>(const <DocumentResponseDtoStatusEnum>[
  _$documentResponseDtoStatusEnum_uploaded,
  _$documentResponseDtoStatusEnum_queued,
  _$documentResponseDtoStatusEnum_extracting,
  _$documentResponseDtoStatusEnum_ready,
  _$documentResponseDtoStatusEnum_failed,
]);

Serializer<DocumentResponseDtoStatusEnum>
    _$documentResponseDtoStatusEnumSerializer =
    _$DocumentResponseDtoStatusEnumSerializer();

class _$DocumentResponseDtoStatusEnumSerializer
    implements PrimitiveSerializer<DocumentResponseDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'uploaded': 'uploaded',
    'queued': 'queued',
    'extracting': 'extracting',
    'ready': 'ready',
    'failed': 'failed',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'uploaded': 'uploaded',
    'queued': 'queued',
    'extracting': 'extracting',
    'ready': 'ready',
    'failed': 'failed',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentResponseDtoStatusEnum];
  @override
  final String wireName = 'DocumentResponseDtoStatusEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentResponseDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentResponseDtoStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentResponseDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentResponseDto extends DocumentResponseDto {
  @override
  final String id;
  @override
  final String filename;
  @override
  final String title;
  @override
  final DocumentResponseDtoStatusEnum status;
  @override
  final String mimeType;
  @override
  final BuiltList<JsonObject> tags;
  @override
  final String createdAt;
  @override
  final String updatedAt;
  @override
  final DocumentExtractionSummaryDto? extraction;

  factory _$DocumentResponseDto(
          [void Function(DocumentResponseDtoBuilder)? updates]) =>
      (DocumentResponseDtoBuilder()..update(updates))._build();

  _$DocumentResponseDto._(
      {required this.id,
      required this.filename,
      required this.title,
      required this.status,
      required this.mimeType,
      required this.tags,
      required this.createdAt,
      required this.updatedAt,
      this.extraction})
      : super._();
  @override
  DocumentResponseDto rebuild(
          void Function(DocumentResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentResponseDtoBuilder toBuilder() =>
      DocumentResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentResponseDto &&
        id == other.id &&
        filename == other.filename &&
        title == other.title &&
        status == other.status &&
        mimeType == other.mimeType &&
        tags == other.tags &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        extraction == other.extraction;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, filename.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, mimeType.hashCode);
    _$hash = $jc(_$hash, tags.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, extraction.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentResponseDto')
          ..add('id', id)
          ..add('filename', filename)
          ..add('title', title)
          ..add('status', status)
          ..add('mimeType', mimeType)
          ..add('tags', tags)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('extraction', extraction))
        .toString();
  }
}

class DocumentResponseDtoBuilder
    implements Builder<DocumentResponseDto, DocumentResponseDtoBuilder> {
  _$DocumentResponseDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _filename;
  String? get filename => _$this._filename;
  set filename(String? filename) => _$this._filename = filename;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  DocumentResponseDtoStatusEnum? _status;
  DocumentResponseDtoStatusEnum? get status => _$this._status;
  set status(DocumentResponseDtoStatusEnum? status) => _$this._status = status;

  String? _mimeType;
  String? get mimeType => _$this._mimeType;
  set mimeType(String? mimeType) => _$this._mimeType = mimeType;

  ListBuilder<JsonObject>? _tags;
  ListBuilder<JsonObject> get tags =>
      _$this._tags ??= ListBuilder<JsonObject>();
  set tags(ListBuilder<JsonObject>? tags) => _$this._tags = tags;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  DocumentExtractionSummaryDtoBuilder? _extraction;
  DocumentExtractionSummaryDtoBuilder get extraction =>
      _$this._extraction ??= DocumentExtractionSummaryDtoBuilder();
  set extraction(DocumentExtractionSummaryDtoBuilder? extraction) =>
      _$this._extraction = extraction;

  DocumentResponseDtoBuilder() {
    DocumentResponseDto._defaults(this);
  }

  DocumentResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _filename = $v.filename;
      _title = $v.title;
      _status = $v.status;
      _mimeType = $v.mimeType;
      _tags = $v.tags.toBuilder();
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _extraction = $v.extraction?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentResponseDto other) {
    _$v = other as _$DocumentResponseDto;
  }

  @override
  void update(void Function(DocumentResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentResponseDto build() => _build();

  _$DocumentResponseDto _build() {
    _$DocumentResponseDto _$result;
    try {
      _$result = _$v ??
          _$DocumentResponseDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'DocumentResponseDto', 'id'),
            filename: BuiltValueNullFieldError.checkNotNull(
                filename, r'DocumentResponseDto', 'filename'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'DocumentResponseDto', 'title'),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'DocumentResponseDto', 'status'),
            mimeType: BuiltValueNullFieldError.checkNotNull(
                mimeType, r'DocumentResponseDto', 'mimeType'),
            tags: tags.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'DocumentResponseDto', 'createdAt'),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
                updatedAt, r'DocumentResponseDto', 'updatedAt'),
            extraction: _extraction?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tags';
        tags.build();

        _$failedField = 'extraction';
        _extraction?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DocumentResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
