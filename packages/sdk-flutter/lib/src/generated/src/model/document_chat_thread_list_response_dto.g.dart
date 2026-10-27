// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_thread_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentChatThreadListResponseDto
    extends DocumentChatThreadListResponseDto {
  @override
  final String nextCursor;
  @override
  final bool hasMore;
  @override
  final num total;
  @override
  final BuiltList<DocumentChatThreadDto> threads;

  factory _$DocumentChatThreadListResponseDto(
          [void Function(DocumentChatThreadListResponseDtoBuilder)? updates]) =>
      (new DocumentChatThreadListResponseDtoBuilder()..update(updates))
          ._build();

  _$DocumentChatThreadListResponseDto._(
      {required this.nextCursor,
      required this.hasMore,
      required this.total,
      required this.threads})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        nextCursor, r'DocumentChatThreadListResponseDto', 'nextCursor');
    BuiltValueNullFieldError.checkNotNull(
        hasMore, r'DocumentChatThreadListResponseDto', 'hasMore');
    BuiltValueNullFieldError.checkNotNull(
        total, r'DocumentChatThreadListResponseDto', 'total');
    BuiltValueNullFieldError.checkNotNull(
        threads, r'DocumentChatThreadListResponseDto', 'threads');
  }

  @override
  DocumentChatThreadListResponseDto rebuild(
          void Function(DocumentChatThreadListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatThreadListResponseDtoBuilder toBuilder() =>
      new DocumentChatThreadListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatThreadListResponseDto &&
        nextCursor == other.nextCursor &&
        hasMore == other.hasMore &&
        total == other.total &&
        threads == other.threads;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, nextCursor.hashCode);
    _$hash = $jc(_$hash, hasMore.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, threads.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentChatThreadListResponseDto')
          ..add('nextCursor', nextCursor)
          ..add('hasMore', hasMore)
          ..add('total', total)
          ..add('threads', threads))
        .toString();
  }
}

class DocumentChatThreadListResponseDtoBuilder
    implements
        Builder<DocumentChatThreadListResponseDto,
            DocumentChatThreadListResponseDtoBuilder> {
  _$DocumentChatThreadListResponseDto? _$v;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  bool? _hasMore;
  bool? get hasMore => _$this._hasMore;
  set hasMore(bool? hasMore) => _$this._hasMore = hasMore;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  ListBuilder<DocumentChatThreadDto>? _threads;
  ListBuilder<DocumentChatThreadDto> get threads =>
      _$this._threads ??= new ListBuilder<DocumentChatThreadDto>();
  set threads(ListBuilder<DocumentChatThreadDto>? threads) =>
      _$this._threads = threads;

  DocumentChatThreadListResponseDtoBuilder() {
    DocumentChatThreadListResponseDto._defaults(this);
  }

  DocumentChatThreadListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _nextCursor = $v.nextCursor;
      _hasMore = $v.hasMore;
      _total = $v.total;
      _threads = $v.threads.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatThreadListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentChatThreadListResponseDto;
  }

  @override
  void update(
      void Function(DocumentChatThreadListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatThreadListResponseDto build() => _build();

  _$DocumentChatThreadListResponseDto _build() {
    _$DocumentChatThreadListResponseDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentChatThreadListResponseDto._(
              nextCursor: BuiltValueNullFieldError.checkNotNull(nextCursor,
                  r'DocumentChatThreadListResponseDto', 'nextCursor'),
              hasMore: BuiltValueNullFieldError.checkNotNull(
                  hasMore, r'DocumentChatThreadListResponseDto', 'hasMore'),
              total: BuiltValueNullFieldError.checkNotNull(
                  total, r'DocumentChatThreadListResponseDto', 'total'),
              threads: threads.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'threads';
        threads.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentChatThreadListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
