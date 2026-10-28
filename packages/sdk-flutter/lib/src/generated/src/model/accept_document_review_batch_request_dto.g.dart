// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accept_document_review_batch_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AcceptDocumentReviewBatchRequestDto
    extends AcceptDocumentReviewBatchRequestDto {
  @override
  final num? minConfidence;

  factory _$AcceptDocumentReviewBatchRequestDto(
          [void Function(AcceptDocumentReviewBatchRequestDtoBuilder)?
              updates]) =>
      (new AcceptDocumentReviewBatchRequestDtoBuilder()..update(updates))
          ._build();

  _$AcceptDocumentReviewBatchRequestDto._({this.minConfidence}) : super._();

  @override
  AcceptDocumentReviewBatchRequestDto rebuild(
          void Function(AcceptDocumentReviewBatchRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AcceptDocumentReviewBatchRequestDtoBuilder toBuilder() =>
      new AcceptDocumentReviewBatchRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AcceptDocumentReviewBatchRequestDto &&
        minConfidence == other.minConfidence;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, minConfidence.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AcceptDocumentReviewBatchRequestDto')
          ..add('minConfidence', minConfidence))
        .toString();
  }
}

class AcceptDocumentReviewBatchRequestDtoBuilder
    implements
        Builder<AcceptDocumentReviewBatchRequestDto,
            AcceptDocumentReviewBatchRequestDtoBuilder> {
  _$AcceptDocumentReviewBatchRequestDto? _$v;

  num? _minConfidence;
  num? get minConfidence => _$this._minConfidence;
  set minConfidence(num? minConfidence) =>
      _$this._minConfidence = minConfidence;

  AcceptDocumentReviewBatchRequestDtoBuilder() {
    AcceptDocumentReviewBatchRequestDto._defaults(this);
  }

  AcceptDocumentReviewBatchRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _minConfidence = $v.minConfidence;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AcceptDocumentReviewBatchRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$AcceptDocumentReviewBatchRequestDto;
  }

  @override
  void update(
      void Function(AcceptDocumentReviewBatchRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AcceptDocumentReviewBatchRequestDto build() => _build();

  _$AcceptDocumentReviewBatchRequestDto _build() {
    final _$result = _$v ??
        new _$AcceptDocumentReviewBatchRequestDto._(
            minConfidence: minConfidence);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
