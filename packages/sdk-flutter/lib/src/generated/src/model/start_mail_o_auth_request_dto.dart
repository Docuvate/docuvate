//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'start_mail_o_auth_request_dto.g.dart';

/// StartMailOAuthRequestDto
///
/// Properties:
/// * [displayName] 
/// * [accountHint] 
@BuiltValue()
abstract class StartMailOAuthRequestDto implements Built<StartMailOAuthRequestDto, StartMailOAuthRequestDtoBuilder> {
  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'accountHint')
  String? get accountHint;

  StartMailOAuthRequestDto._();

  factory StartMailOAuthRequestDto([void updates(StartMailOAuthRequestDtoBuilder b)]) = _$StartMailOAuthRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StartMailOAuthRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StartMailOAuthRequestDto> get serializer => _$StartMailOAuthRequestDtoSerializer();
}

class _$StartMailOAuthRequestDtoSerializer implements PrimitiveSerializer<StartMailOAuthRequestDto> {
  @override
  final Iterable<Type> types = const [StartMailOAuthRequestDto, _$StartMailOAuthRequestDto];

  @override
  final String wireName = r'StartMailOAuthRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StartMailOAuthRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
    if (object.accountHint != null) {
      yield r'accountHint';
      yield serializers.serialize(
        object.accountHint,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    StartMailOAuthRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required StartMailOAuthRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'accountHint':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.accountHint = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  StartMailOAuthRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StartMailOAuthRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

