// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'label_map_response_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LabelMapResponseDtoClassEmptyReasonEnum
    _$labelMapResponseDtoClassEmptyReasonEnum_noExtractedDocuments =
    const LabelMapResponseDtoClassEmptyReasonEnum._('noExtractedDocuments');
const LabelMapResponseDtoClassEmptyReasonEnum
    _$labelMapResponseDtoClassEmptyReasonEnum_awaitingEmbeddings =
    const LabelMapResponseDtoClassEmptyReasonEnum._('awaitingEmbeddings');
const LabelMapResponseDtoClassEmptyReasonEnum
    _$labelMapResponseDtoClassEmptyReasonEnum_embeddingUnavailable =
    const LabelMapResponseDtoClassEmptyReasonEnum._('embeddingUnavailable');

LabelMapResponseDtoClassEmptyReasonEnum
    _$labelMapResponseDtoClassEmptyReasonEnumValueOf(String name) {
  switch (name) {
    case 'noExtractedDocuments':
      return _$labelMapResponseDtoClassEmptyReasonEnum_noExtractedDocuments;
    case 'awaitingEmbeddings':
      return _$labelMapResponseDtoClassEmptyReasonEnum_awaitingEmbeddings;
    case 'embeddingUnavailable':
      return _$labelMapResponseDtoClassEmptyReasonEnum_embeddingUnavailable;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<LabelMapResponseDtoClassEmptyReasonEnum>
    _$labelMapResponseDtoClassEmptyReasonEnumValues = new BuiltSet<
        LabelMapResponseDtoClassEmptyReasonEnum>(const <LabelMapResponseDtoClassEmptyReasonEnum>[
  _$labelMapResponseDtoClassEmptyReasonEnum_noExtractedDocuments,
  _$labelMapResponseDtoClassEmptyReasonEnum_awaitingEmbeddings,
  _$labelMapResponseDtoClassEmptyReasonEnum_embeddingUnavailable,
]);

Serializer<LabelMapResponseDtoClassEmptyReasonEnum>
    _$labelMapResponseDtoClassEmptyReasonEnumSerializer =
    new _$LabelMapResponseDtoClassEmptyReasonEnumSerializer();

class _$LabelMapResponseDtoClassEmptyReasonEnumSerializer
    implements PrimitiveSerializer<LabelMapResponseDtoClassEmptyReasonEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'noExtractedDocuments': 'no_extracted_documents',
    'awaitingEmbeddings': 'awaiting_embeddings',
    'embeddingUnavailable': 'embedding_unavailable',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'no_extracted_documents': 'noExtractedDocuments',
    'awaiting_embeddings': 'awaitingEmbeddings',
    'embedding_unavailable': 'embeddingUnavailable',
  };

  @override
  final Iterable<Type> types = const <Type>[
    LabelMapResponseDtoClassEmptyReasonEnum
  ];
  @override
  final String wireName = 'LabelMapResponseDtoClassEmptyReasonEnum';

  @override
  Object serialize(Serializers serializers,
          LabelMapResponseDtoClassEmptyReasonEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LabelMapResponseDtoClassEmptyReasonEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LabelMapResponseDtoClassEmptyReasonEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$LabelMapResponseDtoClass extends LabelMapResponseDtoClass {
  @override
  final BuiltList<JsonObject> points;
  @override
  final num documentCount;
  @override
  final num tagCount;
  @override
  final num extractedDocumentCount;
  @override
  final LabelMapResponseDtoClassEmptyReasonEnum? emptyReason;

  factory _$LabelMapResponseDtoClass(
          [void Function(LabelMapResponseDtoClassBuilder)? updates]) =>
      (new LabelMapResponseDtoClassBuilder()..update(updates))._build();

  _$LabelMapResponseDtoClass._(
      {required this.points,
      required this.documentCount,
      required this.tagCount,
      required this.extractedDocumentCount,
      this.emptyReason})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        points, r'LabelMapResponseDtoClass', 'points');
    BuiltValueNullFieldError.checkNotNull(
        documentCount, r'LabelMapResponseDtoClass', 'documentCount');
    BuiltValueNullFieldError.checkNotNull(
        tagCount, r'LabelMapResponseDtoClass', 'tagCount');
    BuiltValueNullFieldError.checkNotNull(extractedDocumentCount,
        r'LabelMapResponseDtoClass', 'extractedDocumentCount');
  }

  @override
  LabelMapResponseDtoClass rebuild(
          void Function(LabelMapResponseDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LabelMapResponseDtoClassBuilder toBuilder() =>
      new LabelMapResponseDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LabelMapResponseDtoClass &&
        points == other.points &&
        documentCount == other.documentCount &&
        tagCount == other.tagCount &&
        extractedDocumentCount == other.extractedDocumentCount &&
        emptyReason == other.emptyReason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, points.hashCode);
    _$hash = $jc(_$hash, documentCount.hashCode);
    _$hash = $jc(_$hash, tagCount.hashCode);
    _$hash = $jc(_$hash, extractedDocumentCount.hashCode);
    _$hash = $jc(_$hash, emptyReason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LabelMapResponseDtoClass')
          ..add('points', points)
          ..add('documentCount', documentCount)
          ..add('tagCount', tagCount)
          ..add('extractedDocumentCount', extractedDocumentCount)
          ..add('emptyReason', emptyReason))
        .toString();
  }
}

class LabelMapResponseDtoClassBuilder
    implements
        Builder<LabelMapResponseDtoClass, LabelMapResponseDtoClassBuilder> {
  _$LabelMapResponseDtoClass? _$v;

  ListBuilder<JsonObject>? _points;
  ListBuilder<JsonObject> get points =>
      _$this._points ??= new ListBuilder<JsonObject>();
  set points(ListBuilder<JsonObject>? points) => _$this._points = points;

  num? _documentCount;
  num? get documentCount => _$this._documentCount;
  set documentCount(num? documentCount) =>
      _$this._documentCount = documentCount;

  num? _tagCount;
  num? get tagCount => _$this._tagCount;
  set tagCount(num? tagCount) => _$this._tagCount = tagCount;

  num? _extractedDocumentCount;
  num? get extractedDocumentCount => _$this._extractedDocumentCount;
  set extractedDocumentCount(num? extractedDocumentCount) =>
      _$this._extractedDocumentCount = extractedDocumentCount;

  LabelMapResponseDtoClassEmptyReasonEnum? _emptyReason;
  LabelMapResponseDtoClassEmptyReasonEnum? get emptyReason =>
      _$this._emptyReason;
  set emptyReason(LabelMapResponseDtoClassEmptyReasonEnum? emptyReason) =>
      _$this._emptyReason = emptyReason;

  LabelMapResponseDtoClassBuilder() {
    LabelMapResponseDtoClass._defaults(this);
  }

  LabelMapResponseDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _points = $v.points.toBuilder();
      _documentCount = $v.documentCount;
      _tagCount = $v.tagCount;
      _extractedDocumentCount = $v.extractedDocumentCount;
      _emptyReason = $v.emptyReason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LabelMapResponseDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LabelMapResponseDtoClass;
  }

  @override
  void update(void Function(LabelMapResponseDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LabelMapResponseDtoClass build() => _build();

  _$LabelMapResponseDtoClass _build() {
    _$LabelMapResponseDtoClass _$result;
    try {
      _$result = _$v ??
          new _$LabelMapResponseDtoClass._(
              points: points.build(),
              documentCount: BuiltValueNullFieldError.checkNotNull(
                  documentCount, r'LabelMapResponseDtoClass', 'documentCount'),
              tagCount: BuiltValueNullFieldError.checkNotNull(
                  tagCount, r'LabelMapResponseDtoClass', 'tagCount'),
              extractedDocumentCount: BuiltValueNullFieldError.checkNotNull(
                  extractedDocumentCount,
                  r'LabelMapResponseDtoClass',
                  'extractedDocumentCount'),
              emptyReason: emptyReason);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'points';
        points.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'LabelMapResponseDtoClass', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
